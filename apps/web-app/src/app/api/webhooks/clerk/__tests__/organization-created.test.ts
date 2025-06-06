import type { OrganizationWebhookEvent } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Orgs, Users } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { handleOrganizationCreated } from '../organization-created';

describe('handleOrganizationCreated', () => {
  it('should create an organization and link to user', async () => {
    const userId = 'user_29w83sxmDNGwOuEthce5gg56FcC';
    await db.insert(Users).values({
      id: userId,
      clerkId: userId,
      email: 'example@example.org',
      firstName: 'Example',
      lastName: 'Example',
      avatarUrl: 'https://img.clerk.com/xxxxxx',
    });

    const orgId = 'org_123';
    const event = {
      data: {
        id: orgId,
        object: 'organization',
        name: 'Test Org',
        created_by: userId,
        slug: 'test-org',
        has_image: false,
        updated_at: 0,
        max_allowed_memberships: 10,
        admin_delete_enabled: true,
        public_metadata: {},
        created_at: 0,
      },
      object: 'event',
      type: 'organization.created',
    } satisfies OrganizationWebhookEvent;

    const response = await handleOrganizationCreated(event);
    expect(response).toBeUndefined();

    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.clerkOrgId, orgId),
    });
    expect(org).toBeDefined();
    expect(org?.createdByUserId).toBe(userId);
    await db.delete(Orgs).where(eq(Orgs.clerkOrgId, orgId));
    await db.delete(Users).where(eq(Users.clerkId, userId));
  });
});
