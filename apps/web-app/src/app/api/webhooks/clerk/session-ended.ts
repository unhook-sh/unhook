import { posthog } from '@unhook/analytics/posthog/server';
import type { WebhookEvent } from '@clerk/nextjs/server';

export async function handleSessionEnded(event: WebhookEvent) {
  const { id, user_id, session_id } = event.data;

  // Track session ended event
  posthog.capture({
    event: 'session_ended',
    distinctId: user_id,
    properties: {
      session_id: id,
      user_id,
      source: 'clerk_webhook',
    },
  });

  return new Response('Session ended event processed', { status: 200 });
}