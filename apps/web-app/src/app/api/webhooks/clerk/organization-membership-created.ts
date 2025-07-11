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
      orgId: membershipData.organization.id,
      userId: membershipData.public_user_data.user_id,
    });
    return new Response('', { status: 200 });
  }

  const [member] = await db
    .insert(OrgMembers)
    .values({
      orgId: org.id,
      role: membershipData.role === 'admin' ? 'admin' : 'user',
      userId: user.id,
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
      orgId: org.id,
      role: membershipData.role,
      userId: user.id,
    },
  });

  return undefined;
}
