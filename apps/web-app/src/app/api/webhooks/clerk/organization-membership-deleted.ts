import type {
  OrganizationMembershipJSON,
  WebhookEvent,
} from '@clerk/nextjs/server';
import { posthog } from '@unhook/analytics/posthog/server';
import { db } from '@unhook/db/client';
import { Orgs } from '@unhook/db/schema';
import { PLAN_TYPES, stripe } from '@unhook/stripe';
import { eq } from 'drizzle-orm';

export async function handleOrganizationMembershipDeleted(event: WebhookEvent) {
  // Narrow event.data to OrganizationMembershipJSON for 'organizationMembership.updated' events
  const membershipData = event.data as OrganizationMembershipJSON;

  posthog.capture({
    distinctId: membershipData.public_user_data.user_id,
    event: 'delete_organization_membership',
    properties: {
      orgId: membershipData.organization.id,
      userId: membershipData.public_user_data.user_id,
    },
  });

  // Find the organization in our database
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.clerkOrgId, membershipData.organization.id),
  });

  if (!org) {
    console.log(
      `Organization not found for Clerk org ID: ${membershipData.organization.id}`,
    );
    return new Response('Organization not found', { status: 200 });
  }

  // Check if the organization has an active subscription
  if (!org.stripeSubscriptionId || org.stripeSubscriptionStatus !== 'active') {
    console.log(`Organization ${org.id} does not have an active subscription`);
    return new Response('No active subscription', { status: 200 });
  }

  try {
    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      org.stripeSubscriptionId,
      {
        expand: ['items.data.price'],
      },
    );

    // Check if this is a team plan (per-user billing)
    const isTeamPlan = subscription.metadata?.planType === PLAN_TYPES.TEAM;

    if (!isTeamPlan) {
      console.log(
        `Organization ${org.id} is not on a team plan, skipping quantity update`,
      );
      return new Response('Not a team plan', { status: 200 });
    }

    // Count current organization members (after the deletion)
    const currentMemberCount = membershipData.organization.members_count || 0;

    // Ensure we don't go below 1 user (the minimum for a team plan)
    const adjustedMemberCount = Math.max(currentMemberCount, 1);

    // Update the subscription quantity to match the new member count
    // For team plans, the quantity represents the number of users
    const _updatedSubscription = await stripe.subscriptions.update(
      org.stripeSubscriptionId,
      {
        items: subscription.items.data.map((item) => ({
          id: item.id,
          quantity: adjustedMemberCount,
        })),
      },
    );

    console.log(
      `Updated subscription ${org.stripeSubscriptionId} quantity to ${adjustedMemberCount} for organization ${org.id} (after member deletion)`,
    );

    // Track the subscription update
    posthog.capture({
      distinctId: membershipData.public_user_data.user_id,
      event: 'subscription_quantity_updated',
      properties: {
        clerkOrgId: membershipData.organization.id,
        newQuantity: adjustedMemberCount,
        orgId: org.id,
        planType: PLAN_TYPES.TEAM,
        reason: 'member_deleted',
        subscriptionId: org.stripeSubscriptionId,
      },
    });

    return undefined;
  } catch (error) {
    console.error(
      'Error updating subscription quantity after member deletion:',
      error,
    );

    // Track the error
    posthog.capture({
      distinctId: membershipData.public_user_data.user_id,
      event: 'subscription_quantity_update_failed',
      properties: {
        clerkOrgId: membershipData.organization.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        orgId: org.id,
        reason: 'member_deleted',
        subscriptionId: org.stripeSubscriptionId,
      },
    });

    // Return error response instead of undefined
    return new Response(
      `Error updating subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 },
    );
  }
}
