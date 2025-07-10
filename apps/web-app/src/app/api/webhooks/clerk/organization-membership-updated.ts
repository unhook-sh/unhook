import type {
  OrganizationMembershipJSON,
  WebhookEvent,
} from '@clerk/nextjs/server';
import { posthog } from '@unhook/analytics/posthog/server';
import { db } from '@unhook/db/client';
import { OrgMembers, Orgs, Users } from '@unhook/db/schema';
import { and, eq } from 'drizzle-orm';

export async function handleOrganizationMembershipUpdated(event: WebhookEvent) {
  // Narrow event.data to OrganizationMembershipJSON for 'organizationMembership.updated' events
  const membershipData = event.data as OrganizationMembershipJSON;

  // Find the user and org
  const [user, org] = await Promise.all([
    db.query.Users.findFirst({
      where: eq(Users.clerkId, membershipData.public_user_data.user_id),
    }),
    db.query.Orgs.findFirst({
      where: eq(Orgs.clerkOrgId, membershipData.organization.id),
    }),
  ]);

  if (!user || !org) {
    console.log('User or org not found for membership update', {
      orgId: membershipData.organization.id,
      userId: membershipData.public_user_data.user_id,
    });
    return new Response('', { status: 200 });
  }

  const [member] = await db
    .update(OrgMembers)
    .set({
      role: membershipData.role === 'admin' ? 'admin' : 'user',
    })
    .where(and(eq(OrgMembers.userId, user.id), eq(OrgMembers.orgId, org.id)))
    .returning({
      id: OrgMembers.id,
      role: OrgMembers.role,
    });

  if (!member) {
    return new Response('Organization membership not found on update', {
      status: 400,
    });
  }

  posthog.capture({
    distinctId: member.id,
    event: 'update_organization_membership',
    properties: {
      orgId: org.id,
      role: member.role,
      userId: user.id,
    },
  });

  return undefined;
}
