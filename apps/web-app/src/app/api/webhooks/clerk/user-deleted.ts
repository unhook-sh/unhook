import type { UserJSON, WebhookEvent } from '@clerk/nextjs/server';
import { posthog } from '@unhook/analytics/posthog/server';

export async function handleUserDeleted(event: WebhookEvent) {
  // Narrow event.data to UserJSON for 'user.deleted' events
  const userData = event.data as UserJSON;
  const email = userData.email_addresses.find(
    (email: { id: string; email_address: string }) =>
      email.id === userData.primary_email_address_id,
  )?.email_address;

  // Track user deletion event
  posthog.capture({
    distinctId: userData.id,
    event: 'user_deleted',
    properties: {
      email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      source: 'clerk_webhook',
      user_id: userData.id,
    },
  });

  return new Response('User deleted event processed', { status: 200 });
}
