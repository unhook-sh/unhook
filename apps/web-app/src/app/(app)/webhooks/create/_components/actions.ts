'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Webhooks } from '@unhook/db/schema';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

export const createWebhook = action
  .schema(
    z.object({
      name: z.string().optional(),
      isPrivate: z.boolean().optional().default(false),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { name, isPrivate } = parsedInput;
    const user = await auth();

    if (!user.userId) {
      throw new Error('User not found');
    }

    if (!user.orgId) {
      throw new Error('Organization not found');
    }

    const [webhook] = await db
      .insert(Webhooks)
      .values({
        name: name ?? 'Default',
        orgId: user.orgId,
        userId: user.userId,
        isPrivate,
      })
      .returning();

    if (!webhook) {
      throw new Error('Failed to create webhook');
    }

    return webhook;
  });
