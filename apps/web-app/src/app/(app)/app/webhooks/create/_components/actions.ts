'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { OrgMembers, Orgs, Users, Webhooks } from '@unhook/db/schema';
import { and, eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

export const createWebhook = action
  .inputSchema(
    z.object({
      isPrivate: z.boolean().optional().default(false),
      orgId: z.string().optional(),
      orgName: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { isPrivate, orgName, orgId } = parsedInput;
    const user = await auth();

    if (!user.userId) {
      throw new Error('User not found');
    }

    // Use provided orgId or fall back to user's orgId from auth context
    const targetOrgId = orgId || user.orgId;
    if (!targetOrgId) {
      throw new Error('Organization not found');
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error('User details not found');
    }

    // Upsert user
    const [dbUser] = await db
      .insert(Users)
      .values({
        avatarUrl: clerkUser.imageUrl ?? null,
        clerkId: user.userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        firstName: clerkUser.firstName ?? null,
        id: user.userId,
        lastLoggedInAt: new Date(),
        lastName: clerkUser.lastName ?? null,
      })
      .onConflictDoUpdate({
        set: {
          avatarUrl: clerkUser.imageUrl ?? null,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
          firstName: clerkUser.firstName ?? null,
          lastLoggedInAt: new Date(),
          lastName: clerkUser.lastName ?? null,
          updatedAt: new Date(),
        },
        target: Users.clerkId,
      })
      .returning();

    if (!dbUser) {
      throw new Error('Failed to create/update user');
    }

    // Upsert organization
    const [org] = await db
      .insert(Orgs)
      .values({
        clerkOrgId: targetOrgId,
        createdByUserId: user.userId,
        id: targetOrgId,
        name: orgName,
      })
      .onConflictDoUpdate({
        set: {
          name: orgName,
          updatedAt: new Date(),
        },
        target: Orgs.clerkOrgId,
      })
      .returning();

    if (!org) {
      throw new Error('Failed to create/update organization');
    }

    // Upsert organization member
    const [orgMember] = await db
      .insert(OrgMembers)
      .values({
        orgId: org.id,
        role: 'admin',
        userId: user.userId,
      })
      .onConflictDoUpdate({
        set: {
          role: 'admin',
          updatedAt: new Date(),
        },
        target: [OrgMembers.userId, OrgMembers.orgId],
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
        eq(Webhooks.orgId, targetOrgId),
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
        isPrivate,
        name: 'Default',
        orgId: targetOrgId,
        userId: user.userId,
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
