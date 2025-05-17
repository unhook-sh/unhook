import type { WebhookEvent } from '@clerk/nextjs/server';
import { posthog } from '@unhook/analytics/posthog/server';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { Webhook } from 'svix';

import { db } from '@unhook/db/client';
import { OrgMembers, Orgs, Users } from '@unhook/db/schema';

import { env } from '~/env.server';

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

  if (event.type === 'user.created') {
    const email = event.data.email_addresses.find(
      (email) => email.id === event.data.primary_email_address_id,
    )?.email_address;

    if (!email) {
      return new Response(
        `Email not found on user.created ${JSON.stringify(event.data)}`,
        { status: 400 },
      );
    }

    const [user] = await db
      .insert(Users)
      .values({
        avatarUrl: event.data.image_url,
        clerkId: event.data.id,
        email,
        firstName: event.data.first_name,
        id: event.data.id,
        lastName: event.data.last_name,
      })
      .onConflictDoUpdate({
        set: {
          avatarUrl: event.data.image_url,
          clerkId: event.data.id,
          email,
          firstName: event.data.first_name,
          lastName: event.data.last_name,
        },
        target: Users.email,
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
        firstName: event.data.first_name,
        lastName: event.data.last_name,
      },
    });
  }

  if (event.type === 'user.updated') {
    const email = event.data.email_addresses.find(
      (email) => email.id === event.data.primary_email_address_id,
    )?.email_address;

    const [user] = await db
      .update(Users)
      .set({
        avatarUrl: event.data.image_url,
        email,
        firstName: event.data.first_name,
        lastName: event.data.last_name,
      })
      .where(eq(Users.clerkId, event.data.id))
      .returning({
        email: Users.email,
        id: Users.id,
      });

    if (!user) {
      return new Response('User not found on user.update', { status: 400 });
    }

    posthog.capture({
      distinctId: user.id,
      event: 'update_user',
      properties: {
        email: user.email,
      },
    });
  }

  if (event.type === 'session.created') {
    const existingUser = await db.query.Users.findFirst({
      where: eq(Users.clerkId, event.data.user_id),
    });

    if (!existingUser) {
      console.log('User not found on session.created', event.data.user_id);
      return new Response('', { status: 200 });
    }

    const [user] = await db
      .update(Users)
      .set({
        lastLoggedInAt: new Date(),
      })
      .where(eq(Users.clerkId, event.data.user_id))
      .returning({
        email: Users.email,
        id: Users.id,
      });

    if (!user) {
      return new Response('User not found on session.created', { status: 400 });
    }

    posthog.capture({
      distinctId: user.id,
      event: 'login',
      properties: {
        email: user.email,
      },
    });
  }

  if (event.type === 'organization.created') {
    if (!event.data.created_by) {
      console.log(
        'No created_by field in organization creation event',
        event.data,
      );
      return new Response('', { status: 200 });
    }

    // Find the user who created the organization
    const createdByUser = await db.query.Users.findFirst({
      where: eq(Users.clerkId, event.data.created_by),
    });

    if (!createdByUser) {
      console.log(
        'User not found for organization creation',
        event.data.created_by,
      );
      return new Response('', { status: 200 });
    }

    const [org] = await db
      .insert(Orgs)
      .values({
        id: event.data.id,
        clerkOrgId: event.data.id,
        name: event.data.name,
        createdByUserId: createdByUser.id,
      })
      .onConflictDoUpdate({
        set: {
          name: event.data.name,
          createdByUserId: createdByUser.id,
        },
        target: Orgs.clerkOrgId,
      })
      .returning({
        id: Orgs.id,
      });

    if (!org) {
      return new Response('Failed to create organization', { status: 400 });
    }

    posthog.capture({
      distinctId: org.id,
      event: 'create_organization',
      properties: {
        name: event.data.name,
      },
    });
  }

  if (event.type === 'organization.updated') {
    const [org] = await db
      .update(Orgs)
      .set({
        name: event.data.name,
      })
      .where(eq(Orgs.clerkOrgId, event.data.id))
      .returning({
        id: Orgs.id,
        name: Orgs.name,
      });

    if (!org) {
      return new Response('Organization not found on organization.updated', {
        status: 400,
      });
    }

    posthog.capture({
      distinctId: org.id,
      event: 'update_organization',
      properties: {
        name: org.name,
      },
    });
  }

  if (event.type === 'organizationMembership.created') {
    // Find the user and org
    const [user, org] = await Promise.all([
      db.query.Users.findFirst({
        where: eq(Users.clerkId, event.data.public_user_data.user_id),
      }),
      db.query.Orgs.findFirst({
        where: eq(Orgs.clerkOrgId, event.data.organization.id),
      }),
    ]);

    if (!user || !org) {
      console.log('User or org not found for membership creation', {
        userId: event.data.public_user_data.user_id,
        orgId: event.data.organization.id,
      });
      return new Response('', { status: 200 });
    }

    const [member] = await db
      .insert(OrgMembers)
      .values({
        userId: user.id,
        orgId: org.id,
        role: event.data.role === 'admin' ? 'admin' : 'user',
      })
      .onConflictDoUpdate({
        set: {
          role: event.data.role === 'admin' ? 'admin' : 'user',
        },
        target: [OrgMembers.userId, OrgMembers.orgId],
      })
      .returning({
        id: OrgMembers.id,
      });

    if (!member) {
      return new Response('Failed to create organization membership', {
        status: 400,
      });
    }

    posthog.capture({
      distinctId: member.id,
      event: 'create_organization_membership',
      properties: {
        userId: user.id,
        orgId: org.id,
        role: event.data.role,
      },
    });
  }

  if (event.type === 'organizationMembership.updated') {
    // Find the user and org
    const [user, org] = await Promise.all([
      db.query.Users.findFirst({
        where: eq(Users.clerkId, event.data.public_user_data.user_id),
      }),
      db.query.Orgs.findFirst({
        where: eq(Orgs.clerkOrgId, event.data.organization.id),
      }),
    ]);

    if (!user || !org) {
      console.log('User or org not found for membership update', {
        userId: event.data.public_user_data.user_id,
        orgId: event.data.organization.id,
      });
      return new Response('', { status: 200 });
    }

    const [member] = await db
      .update(OrgMembers)
      .set({
        role: event.data.role === 'admin' ? 'admin' : 'user',
      })
      .where(and(eq(OrgMembers.userId, user.id), eq(OrgMembers.orgId, org.id)))
      .returning({
        id: OrgMembers.id,
        role: OrgMembers.role,
      });

    if (!member) {
      return new Response('Organization membership not found on update', {
        status: 400,
      });
    }

    posthog.capture({
      distinctId: member.id,
      event: 'update_organization_membership',
      properties: {
        userId: user.id,
        orgId: org.id,
        role: member.role,
      },
    });
  }

  await posthog.shutdown();
  return new Response('', { status: 200 });
}
