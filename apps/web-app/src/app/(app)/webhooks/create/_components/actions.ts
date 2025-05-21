'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Webhooks } from '@unhook/db/schema';
import { and, eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

export const createWebhook = action
  .schema(
    z.object({
      isPrivate: z.boolean().optional().default(false),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { isPrivate } = parsedInput;
    const user = await auth();

    if (!user.userId) {
      throw new Error('User not found');
    }

    if (!user.orgId) {
      throw new Error('Organization not found');
    }

    // First check if a "Default" webhook exists for this user
    const existingWebhook = await db.query.Webhooks.findFirst({
      where: and(
        eq(Webhooks.name, 'Default'),
        eq(Webhooks.userId, user.userId),
        eq(Webhooks.orgId, user.orgId),
      ),
    });

    if (existingWebhook) {
      return {
        isNew: false,
        webhook: existingWebhook,
      };
    }

    // If no default webhook exists, create a new one
    const [webhook] = await db
      .insert(Webhooks)
      .values({
        name: 'Default',
        orgId: user.orgId,
        userId: user.userId,
        isPrivate,
      })
      .returning();

    if (!webhook) {
      throw new Error('Failed to create webhook');
    }

    return {
      isNew: true,
      webhook,
    };
  });
