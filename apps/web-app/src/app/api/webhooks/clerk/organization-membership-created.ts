import type {
  OrganizationMembershipJSON,
  WebhookEvent,
} from '@clerk/nextjs/server';
import { posthog } from '@unhook/analytics/posthog/server';
import { db } from '@unhook/db/client';
import { OrgMembers, Orgs, Users } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';

export async function handleOrganizationMembershipCreated(event: WebhookEvent) {
  // Narrow event.data to OrganizationMembershipJSON for 'organizationMembership.created' events
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
    console.log('User or org not found for membership creation', {
      userId: membershipData.public_user_data.user_id,
      orgId: membershipData.organization.id,
    });
    return new Response('', { status: 200 });
  }

  const [member] = await db
    .insert(OrgMembers)
    .values({
      userId: user.id,
      orgId: org.id,
      role: membershipData.role === 'admin' ? 'admin' : 'user',
    })
    .onConflictDoUpdate({
      set: {
        role: membershipData.role === 'admin' ? 'admin' : 'user',
      },
      target: [OrgMembers.userId, OrgMembers.orgId],
    })
    .returning({
      id: OrgMembers.id,
    });

  if (!member) {
    return new Response('Failed to create organization membership', {
      status: 400,
    });
  }

  posthog.capture({
    distinctId: member.id,
    event: 'create_organization_membership',
    properties: {
      userId: user.id,
      orgId: org.id,
      role: membershipData.role,
    },
  });

  return undefined;
}
