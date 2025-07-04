'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Orgs } from '@unhook/db/schema';
import {
  createBillingPortalSession,
  createCheckoutSession,
  getOrCreateCustomer,
} from '@unhook/stripe';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createCheckoutSessionAction(orgId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Get the organization
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.id, orgId),
  });

  if (!org) {
    throw new Error('Organization not found');
  }

  // Get the origin URL
  const headersList = await headers();
  const origin = headersList.get('origin') || 'https://unhook.sh';

  // Create or get Stripe customer
  let customerId = org.stripeCustomerId;

  if (!customerId) {
    // Get user details from Clerk for creating customer
    const user = await auth();

    const customer = await getOrCreateCustomer({
      email: user.sessionClaims?.email as string,
      name: org.name,
      metadata: {
        orgId: org.id,
        clerkOrgId: org.clerkOrgId,
      },
    });

    if (!customer) {
      throw new Error('Failed to create Stripe customer');
    }

    customerId = customer.id;

    // Update org with customer ID
    await db
      .update(Orgs)
      .set({
        stripeCustomerId: customerId,
      })
      .where(eq(Orgs.id, orgId));
  }

  // Create checkout session
  const session = await createCheckoutSession({
    orgId,
    customerId,
    successUrl: `${origin}/${org.clerkOrgId}/billing?success=true`,
    cancelUrl: `${origin}/${org.clerkOrgId}/billing?canceled=true`,
  });

  // Redirect to Stripe Checkout
  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }
  redirect(session.url);
}

export async function createBillingPortalSessionAction(orgId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Get the organization
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.id, orgId),
  });

  if (!org || !org.stripeCustomerId) {
    throw new Error('No active subscription found');
  }

  // Get the origin URL
  const headersList = await headers();
  const origin = headersList.get('origin') || 'https://unhook.sh';

  // Create billing portal session
  const session = await createBillingPortalSession({
    customerId: org.stripeCustomerId,
    returnUrl: `${origin}/${org.clerkOrgId}/billing`,
  });

  // Redirect to Stripe Billing Portal
  redirect(session.url);
}
