import type { WebhookEvent } from '@clerk/nextjs/server';
import { posthog } from '@unhook/analytics/posthog/server';

export async function handleUserDeleted(event: WebhookEvent) {
  // For 'user.deleted' events, event.data only contains minimal info
  const userData = event.data as {
    id: string;
    deleted: boolean;
    object: string;
  };

  // Track user deletion event with available data
  posthog.capture({
    distinctId: userData.id,
    event: 'user_deleted',
    properties: {
      deleted: userData.deleted,
      object: userData.object,
      source: 'clerk_webhook',
      user_id: userData.id,
    },
  });

  return new Response('User deleted event processed', { status: 200 });
}
