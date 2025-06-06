import type { UserWebhookEvent } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Users } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { handleUserUpdated } from '../user-updated';

describe('handleUserUpdated', () => {
  it('should update a user', async () => {
    // First, insert a user to update
    const userId = 'user_29w83sxmDNGwOuEthce5gg56FcC';
    await db.insert(Users).values({
      id: userId,
      clerkId: userId,
      email: 'old@example.org',
      firstName: 'Old',
      lastName: 'Name',
      avatarUrl: 'https://img.clerk.com/old.png',
    });

    const event = {
      data: {
        id: userId,
        object: 'user',
        backup_code_enabled: false,
        banned: false,
        created_at: 0,
        create_organization_enabled: false,
        create_organizations_limit: 0,
        delete_self_enabled: false,
        legal_accepted_at: 0,
        locked: false,
        lockout_expires_in_seconds: 0,
        password_enabled: false,
        phone_numbers: [],
        primary_phone_number_id: null,
        external_accounts: [],
        external_id: '567772',
        last_sign_in_at: 0,
        organization_memberships: [],
        password_last_updated_at: 0,
        saml_accounts: [],
        primary_web3_wallet_id: null,
        public_metadata: {},
        username: null,
        web3_wallets: [],
        private_metadata: {},
        verification_attempts_remaining: 0,
        two_factor_enabled: false,
        totp_enabled: false,
        unsafe_metadata: {},
        updated_at: 0,
        has_image: false,
        last_active_at: 0,
        email_addresses: [
          {
            email_address: 'new@example.org',
            id: 'idn_29w83yL7CwVlJXylYLxcslromF1',
            object: 'email_address',
            linked_to: [],
            verification: {
              status: 'verified',
              strategy: 'email_link',
              attempts: 0,
              expire_at: 0,
              object: 'email_address',
              id: 'idn_29w83yL7CwVlJXylYLxcslromF1',
            },
          },
        ],
        first_name: 'New',
        last_name: 'Name',
        image_url: 'https://img.clerk.com/new.png',
        primary_email_address_id: 'idn_29w83yL7CwVlJXylYLxcslromF1',
      },
      object: 'event',
      type: 'user.updated',
    } satisfies UserWebhookEvent;

    const response = await handleUserUpdated(event);
    expect(response).toBeUndefined();

    const user = await db.query.Users.findFirst({
      where: eq(Users.clerkId, userId),
    });
    expect(user).toBeDefined();
    expect(user?.email).toBe('new@example.org');
    expect(user?.firstName).toBe('New');
    expect(user?.avatarUrl).toBe('https://img.clerk.com/new.png');
    await db.delete(Users).where(eq(Users.clerkId, userId));
  });
});
