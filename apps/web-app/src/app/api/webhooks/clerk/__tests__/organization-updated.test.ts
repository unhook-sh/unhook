import type { OrganizationWebhookEvent } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Orgs, Users } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { handleOrganizationUpdated } from '../organization-updated';

describe('handleOrganizationUpdated', () => {
  it('should update an organization', async () => {
    const orgId = 'org_123';
    await db.insert(Users).values({
      id: 'user_1',
      clerkId: 'user_1',
      email: 'example@example.org',
      firstName: 'Example',
      lastName: 'Example',
    });
    await db.insert(Orgs).values({
      id: orgId,
      clerkOrgId: orgId,
      name: 'Old Org',
      createdByUserId: 'user_1',
    });

    const event = {
      data: {
        id: orgId,
        updated_at: 0,
        name: 'New Org',
        object: 'organization',
        slug: 'new-org',
        has_image: false,
        max_allowed_memberships: 10,
        admin_delete_enabled: true,
        public_metadata: {},
        created_at: 0,
      },
      object: 'event',
      type: 'organization.updated',
    } satisfies OrganizationWebhookEvent;

    const response = await handleOrganizationUpdated(event);
    expect(response).toBeUndefined();

    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.clerkOrgId, orgId),
    });
    expect(org).toBeDefined();
    expect(org?.name).toBe('New Org');
    await db.delete(Orgs).where(eq(Orgs.clerkOrgId, orgId));
    await db.delete(Users).where(eq(Users.clerkId, 'user_1'));
  });
});
