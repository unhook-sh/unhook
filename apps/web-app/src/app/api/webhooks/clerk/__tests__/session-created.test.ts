import type { SessionWebhookEvent } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Users } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { handleSessionCreated } from '../session-created';

describe('handleSessionCreated', () => {
  it('should update lastLoggedInAt for the user', async () => {
    const userId = 'user_29w83sxmDNGwOuEthce5gg56FcC';
    await db.insert(Users).values({
      id: userId,
      clerkId: userId,
      email: 'example@example.org',
      firstName: 'Example',
      lastName: 'Example',
      avatarUrl: 'https://img.clerk.com/xxxxxx',
    });

    const event = {
      data: {
        id: 'sess_123',
        abandon_at: 0,
        created_at: 0,
        expire_at: 0,
        last_active_at: 0,
        updated_at: 0,
        user_id: userId,
        object: 'session',
        client_id: 'client_123',
        status: 'active',
        actor: {
          id: userId,
        },
      },
      object: 'event',
      type: 'session.created',
    } satisfies SessionWebhookEvent;

    const response = await handleSessionCreated(event);
    expect(response).toBeUndefined();

    const user = await db.query.Users.findFirst({
      where: eq(Users.clerkId, userId),
    });
    expect(user).toBeDefined();
    expect(user?.lastLoggedInAt).toBeInstanceOf(Date);
    await db.delete(Users).where(eq(Users.clerkId, userId));
  });
});
