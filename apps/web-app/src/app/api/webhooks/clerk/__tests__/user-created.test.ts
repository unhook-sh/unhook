import type { UserWebhookEvent } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Users } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { handleUserCreated } from '../user-created';

describe('handleUserCreated', () => {
  it('should create a user', async () => {
    const event = {
      data: {
        last_active_at: 0,
        create_organization_enabled: false,
        create_organizations_limit: 0,
        delete_self_enabled: false,
        legal_accepted_at: 0,
        backup_code_enabled: false,
        banned: false,
        locked: false,
        lockout_expires_in_seconds: 0,
        verification_attempts_remaining: 0,
        organization_memberships: [],
        saml_accounts: [],
        password_last_updated_at: 0,
        has_image: false,
        totp_enabled: false,
        created_at: 1654012591514,
        email_addresses: [
          {
            email_address: 'example@example.org',
            id: 'idn_29w83yL7CwVlJXylYLxcslromF1',
            linked_to: [],
            object: 'email_address',
            verification: {
              status: 'verified',
              strategy: 'ticket',
              attempts: 0,
              expire_at: 0,
              object: 'email_address',
              id: '1',
            },
          },
        ],
        external_accounts: [],
        external_id: '567772',
        first_name: 'Example',
        id: 'user_29w83sxmDNGwOuEthce5gg56FcC',
        image_url: 'https://img.clerk.com/xxxxxx',
        last_name: 'Example',
        last_sign_in_at: 1654012591514,
        object: 'user',
        password_enabled: true,
        phone_numbers: [],
        primary_email_address_id: 'idn_29w83yL7CwVlJXylYLxcslromF1',
        primary_phone_number_id: null,
        primary_web3_wallet_id: null,
        private_metadata: {},
        public_metadata: {},
        two_factor_enabled: false,
        unsafe_metadata: {},
        updated_at: 1654012591835,
        username: null,
        web3_wallets: [],
      },
      object: 'event',
      type: 'user.created',
    } satisfies UserWebhookEvent;

    const response = await handleUserCreated(event);

    expect(response).toBeUndefined();

    const user = await db.query.Users.findFirst({
      where: eq(Users.clerkId, event.data.id),
    });

    expect(user).toBeDefined();
    expect(user?.clerkId).toBe(event.data.id);
    await db.delete(Users).where(eq(Users.clerkId, event.data.id));
  });
});
