import type { OrganizationMembershipWebhookEvent } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { OrgMembers, Orgs, Users } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { handleOrganizationMembershipCreated } from '../organization-membership-created';

describe('handleOrganizationMembershipCreated', () => {
  it('should create an organization membership and link to user/org', async () => {
    const userId = 'user_29w83sxmDNGwOuEthce5gg56FcC';
    const orgId = 'org_123';
    await db.insert(Users).values({
      id: userId,
      clerkId: userId,
      email: 'example@example.org',
      firstName: 'Example',
      lastName: 'Example',
      avatarUrl: 'https://img.clerk.com/xxxxxx',
    });
    await db.insert(Orgs).values({
      id: orgId,
      clerkOrgId: orgId,
      name: 'Test Org',
      createdByUserId: userId,
    });

    const event = {
      data: {
        created_at: 0,
        id: '123',
        object: 'organization_membership',
        public_metadata: {},
        updated_at: 0,
        permissions: [],
        public_user_data: {
          user_id: userId,
          identifier: 'example@example.org',
          first_name: 'Example',
          last_name: 'Example',
          image_url: 'https://img.clerk.com/xxxxxx',
          has_image: false,
        },
        organization: {
          id: orgId,
          name: 'Test Org',
          slug: 'test-org',
          has_image: false,
          object: 'organization',
          max_allowed_memberships: 10,
          admin_delete_enabled: true,
          public_metadata: {},
          created_at: 0,
          updated_at: 0,
        },
        role: 'admin',
      },
      object: 'event',
      type: 'organizationMembership.created',
    } satisfies OrganizationMembershipWebhookEvent;

    const response = await handleOrganizationMembershipCreated(event);
    expect(response).toBeUndefined();

    const member = await db.query.OrgMembers.findFirst({
      where: eq(OrgMembers.userId, userId),
    });
    expect(member).toBeDefined();
    expect(member?.orgId).toBe(orgId);
    expect(member?.role).toBe('admin');
    await db.delete(OrgMembers).where(eq(OrgMembers.userId, userId));
    await db.delete(Orgs).where(eq(Orgs.clerkOrgId, orgId));
    await db.delete(Users).where(eq(Users.clerkId, userId));
  });
});
