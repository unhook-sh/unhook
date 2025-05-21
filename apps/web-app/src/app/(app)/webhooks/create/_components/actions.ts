'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { OrgMembers, Orgs, Webhooks } from '@unhook/db/schema';
import { and, eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

export const createWebhook = action
  .schema(
    z.object({
      isPrivate: z.boolean().optional().default(false),
      orgName: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { isPrivate, orgName } = parsedInput;
    const user = await auth();

    if (!user.userId) {
      throw new Error('User not found');
    }

    if (!user.orgId) {
      throw new Error('Organization not found');
    }

    // Upsert organization
    const [org] = await db
      .insert(Orgs)
      .values({
        clerkOrgId: user.orgId,
        name: orgName,
        createdByUserId: user.userId,
        id: user.orgId,
      })
      .onConflictDoUpdate({
        target: Orgs.clerkOrgId,
        set: {
          name: orgName,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!org) {
      throw new Error('Failed to create/update organization');
    }

    // Upsert organization member
    const [orgMember] = await db
      .insert(OrgMembers)
      .values({
        userId: user.userId,
        orgId: org.id,
        role: 'admin',
      })
      .onConflictDoUpdate({
        target: [OrgMembers.userId, OrgMembers.orgId],
        set: {
          role: 'admin',
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!orgMember) {
      throw new Error('Failed to create/update organization member');
    }

    // First check if a "Default" webhook exists for this user
    const existingWebhook = await db.query.Webhooks.findFirst({
      where: and(
        eq(Webhooks.name, 'Default'),
        eq(Webhooks.userId, user.userId),
        eq(Webhooks.orgId, org.id),
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
        orgId: org.id,
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
