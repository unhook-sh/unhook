'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { upsertOrg } from '@unhook/db';
import { db } from '@unhook/db/client';
import { Orgs } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

export const upsertOrgAction = action
  .inputSchema(
    z.object({
      clerkOrgId: z.string().optional(),
      name: z.string().optional(),
      webhookId: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { clerkOrgId, name, webhookId } = parsedInput;
    const user = await auth();

    if (!user.userId) {
      throw new Error('User not found');
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error('User details not found');
    }

    console.log('upsertOrgAction called with:', {
      clerkOrgId,
      userId: user.userId,
      webhookId,
    });

    // If no clerkOrgId is provided (creating new org), check if user already has an organization
    if (!clerkOrgId) {
      const existingOrg = await db.query.Orgs.findFirst({
        where: eq(Orgs.createdByUserId, user.userId),
      });

      console.log('Existing org found:', existingOrg);

      if (existingOrg) {
        // User already has an organization, use upsertOrg to get the proper return structure
        const result = await upsertOrg({
          name: existingOrg.name,
          orgId: existingOrg.clerkOrgId,
          userId: user.userId,
        });

        console.log('Returning existing org result:', result);

        return {
          apiKey: result.apiKey,
          id: result.org.id,
          name: result.org.name,
          stripeCustomerId: result.org.stripeCustomerId,
        };
      }
    }

    console.log('Creating new organization...');

    // Use the upsertOrg utility function
    const result = await upsertOrg({
      name: name || 'Personal',
      orgId: clerkOrgId || '',
      userId: user.userId,
    });

    console.log('New org result:', result);

    // If webhookId is provided, create a custom webhook
    if (webhookId && result.webhook) {
      // Update the webhook with the custom ID
      // Note: This would require additional API calls to update the webhook
      console.log('Custom webhook ID requested:', webhookId);
    }

    return {
      apiKey: result.apiKey,
      id: result.org.id,
      name: result.org.name,
      stripeCustomerId: result.org.stripeCustomerId,
    };
  });

export async function createOrgAction({
  name,
  webhookId,
}: {
  name: string;
  webhookId?: string;
}) {
  // You may want to get user info from session or context if needed
  return upsertOrgAction({ name, webhookId });
}
