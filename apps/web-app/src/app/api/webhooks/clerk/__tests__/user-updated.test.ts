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
      avatarUrl: 'https://img.clerk.com/old.png',
      clerkId: userId,
      email: 'old@example.org',
      firstName: 'Old',
      id: userId,
      lastName: 'Name',
    });

    const event = {
      data: {
        backup_code_enabled: false,
        banned: false,
        create_organization_enabled: false,
        create_organizations_limit: 0,
        created_at: 0,
        delete_self_enabled: false,
        email_addresses: [
          {
            email_address: 'new@example.org',
            id: 'idn_29w83yL7CwVlJXylYLxcslromF1',
            linked_to: [],
            object: 'email_address',
            verification: {
              attempts: 0,
              expire_at: 0,
              id: 'idn_29w83yL7CwVlJXylYLxcslromF1',
              object: 'email_address',
              status: 'verified',
              strategy: 'email_link',
            },
          },
        ],
        external_accounts: [],
        external_id: '567772',
        first_name: 'New',
        has_image: false,
        id: userId,
        image_url: 'https://img.clerk.com/new.png',
        last_active_at: 0,
        last_name: 'Name',
        last_sign_in_at: 0,
        legal_accepted_at: 0,
        locked: false,
        lockout_expires_in_seconds: 0,
        object: 'user',
        organization_memberships: [],
        password_enabled: false,
        password_last_updated_at: 0,
        phone_numbers: [],
        primary_email_address_id: 'idn_29w83yL7CwVlJXylYLxcslromF1',
        primary_phone_number_id: null,
        primary_web3_wallet_id: null,
        private_metadata: {},
        public_metadata: {},
        saml_accounts: [],
        totp_enabled: false,
        two_factor_enabled: false,
        unsafe_metadata: {},
        updated_at: 0,
        username: null,
        verification_attempts_remaining: 0,
        web3_wallets: [],
      },
      event_attributes: {
        http_request: {
          client_ip: '127.0.0.1',
          user_agent: 'test',
        },
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
