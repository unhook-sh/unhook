import type { WebhookEvent } from '@clerk/nextjs/server';
import { posthog } from '@unhook/analytics/posthog/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';

import { env } from '~/env.server';
import { handleOrganizationCreated } from './organization-created';
import { handleOrganizationMembershipCreated } from './organization-membership-created';
import { handleOrganizationMembershipUpdated } from './organization-membership-updated';
import { handleOrganizationUpdated } from './organization-updated';
import { handleSessionCreated } from './session-created';
import { handleUserCreated } from './user-created';
import { handleUserUpdated } from './user-updated';

export async function POST(request: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
  const CLERK_WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    return new Response(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local',
      { status: 400 },
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let event: WebhookEvent;

  // Verify the payload with the headers
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-signature': svixSignature,
      'svix-timestamp': svixTimestamp,
    }) as WebhookEvent;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Do something with the payload
  const { id } = event.data;
  const eventType = event.type;
  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);

  let response: Response | undefined;
  switch (event.type) {
    case 'user.created':
      response = await handleUserCreated(event);
      break;
    case 'user.updated':
      response = await handleUserUpdated(event);
      break;
    case 'session.created':
      response = await handleSessionCreated(event);
      break;
    case 'organization.created':
      response = await handleOrganizationCreated(event);
      break;
    case 'organization.updated':
      response = await handleOrganizationUpdated(event);
      break;
    case 'organizationMembership.created':
      response = await handleOrganizationMembershipCreated(event);
      break;
    case 'organizationMembership.updated':
      response = await handleOrganizationMembershipUpdated(event);
      break;
    default:
      response = undefined;
  }

  await posthog.shutdown();
  return response ?? new Response('', { status: 200 });
}
