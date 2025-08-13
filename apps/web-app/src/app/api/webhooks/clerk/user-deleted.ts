import { posthog } from '@unhook/analytics/posthog/server';
import type { WebhookEvent } from '@clerk/nextjs/server';

export async function handleUserDeleted(event: WebhookEvent) {
  const { id, email_addresses, first_name, last_name } = event.data;

  // Track user deletion event
  posthog.capture({
    event: 'user_deleted',
    distinctId: id,
    properties: {
      user_id: id,
      email: email_addresses?.[0]?.email_address,
      first_name,
      last_name,
      source: 'clerk_webhook',
    },
  });

  return new Response('User deleted event processed', { status: 200 });
}