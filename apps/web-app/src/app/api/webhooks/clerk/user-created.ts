import type { UserJSON, WebhookEvent } from '@clerk/nextjs/server';
import { posthog } from '@unhook/analytics/posthog/server';
import { db } from '@unhook/db/client';
import { Users } from '@unhook/db/schema';

export async function handleUserCreated(event: WebhookEvent) {
  // Narrow event.data to UserJSON for 'user.created' events
  const userData = event.data as UserJSON;
  const email = userData.email_addresses.find(
    (email: { id: string; email_address: string }) =>
      email.id === userData.primary_email_address_id,
  )?.email_address;

  if (!email) {
    return new Response(
      `Email not found on user.created ${JSON.stringify(userData)}`,
      { status: 400 },
    );
  }

  const [user] = await db
    .insert(Users)
    .values({
      avatarUrl: userData.image_url,
      clerkId: userData.id,
      email,
      firstName: userData.first_name,
      id: userData.id,
      lastName: userData.last_name,
    })
    .onConflictDoUpdate({
      set: {
        avatarUrl: userData.image_url,
        clerkId: userData.id,
        email,
        firstName: userData.first_name,
        lastName: userData.last_name,
      },
      target: Users.clerkId,
    })
    .returning({
      id: Users.id,
    });

  if (!user) {
    return new Response('User not found on user.created', { status: 400 });
  }

  posthog.capture({
    distinctId: user.id,
    event: 'create_user',
    properties: {
      email,
      firstName: userData.first_name,
      lastName: userData.last_name,
    },
  });

  return undefined;
}
