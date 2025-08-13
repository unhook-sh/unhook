import type { SessionJSON, WebhookEvent } from '@clerk/nextjs/server';
import { posthog } from '@unhook/analytics/posthog/server';

export async function handleSessionEnded(event: WebhookEvent) {
  // Narrow event.data to SessionJSON for 'session.ended' events
  const sessionData = event.data as SessionJSON;

  // Track session ended event
  posthog.capture({
    distinctId: sessionData.user_id,
    event: 'session_ended',
    properties: {
      session_id: sessionData.id,
      source: 'clerk_webhook',
      user_id: sessionData.user_id,
    },
  });

  return new Response('Session ended event processed', { status: 200 });
}
