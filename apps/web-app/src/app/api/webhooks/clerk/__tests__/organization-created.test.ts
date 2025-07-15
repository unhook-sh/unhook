import type { OrganizationWebhookEvent } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Orgs, Users } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { handleOrganizationCreated } from '../organization-created';

describe('handleOrganizationCreated', () => {
  it('should create an organization and link to user', async () => {
    const userId = 'user_29w83sxmDNGwOuEthce5gg56FcC';
    await db.insert(Users).values({
      avatarUrl: 'https://img.clerk.com/xxxxxx',
      clerkId: userId,
      email: 'example@example.org',
      firstName: 'Example',
      id: userId,
      lastName: 'Example',
    });

    const orgId = 'org_123';
    const event = {
      data: {
        admin_delete_enabled: true,
        created_at: 0,
        created_by: userId,
        has_image: false,
        id: orgId,
        max_allowed_memberships: 10,
        name: 'Test Org',
        object: 'organization',
        public_metadata: {},
        slug: 'test-org',
        updated_at: 0,
      },
      event_attributes: {
        http_request: {
          client_ip: '127.0.0.1',
          user_agent: 'test',
        },
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
