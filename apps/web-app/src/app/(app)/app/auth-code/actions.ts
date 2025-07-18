'use server';

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { upsertOrg } from '@unhook/db';
import { db } from '@unhook/db/client';
import { AuthCodes, Users } from '@unhook/db/schema';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

export const createAuthCode = action.action(async () => {
  const user = await auth();

  if (!user.userId) {
    throw new Error('User not found');
  }

  if (!user.orgId) {
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

  const clerk = await clerkClient();
  const clerkOrg = await clerk.organizations.getOrganization({
    organizationId: user.orgId,
  });

  // Use the upsertOrg utility function
  await upsertOrg({
    clerkOrgId: user.orgId,
    name: clerkOrg.name,
    userEmail: clerkUser.emailAddresses[0]?.emailAddress ?? '',
    userId: user.userId,
  });

  // First check for an existing unused and non-expired auth code
  const existingAuthCode = await db.query.AuthCodes.findFirst({
    where: (authCode, { and, eq, isNull, gt }) =>
      and(
        eq(authCode.userId, user.userId),
        eq(authCode.orgId, user.orgId as string),
        isNull(authCode.usedAt),
        gt(authCode.expiresAt, new Date()),
      ),
  });

  if (existingAuthCode) {
    return {
      authCode: existingAuthCode,
      isNew: false,
    };
  }

  console.log('creating auth code', user.orgId, user.userId, user.sessionId);
  // If no valid auth code exists, create a new one
  const [authCode] = await db
    .insert(AuthCodes)
    .values({
      orgId: user.orgId,
      sessionId: user.sessionId,
      userId: user.userId,
    })
    .returning();

  if (!authCode) {
    throw new Error('Failed to create auth code');
  }

  return {
    authCode,
    isNew: true,
  };
});

export const upsertOrgAction = action
  .inputSchema(
    z.object({
      clerkOrgId: z.string().optional(),
      name: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { name, clerkOrgId } = parsedInput;
    const user = await auth();

    if (!user.userId) {
      throw new Error('User not found');
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error('User details not found');
    }

    // Use the upsertOrg utility function
    const result = await upsertOrg({
      clerkOrgId: clerkOrgId || '',
      name,
      userEmail: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      userId: user.userId,
    });

    return {
      apiKey: result.apiKey,
      id: result.org.id,
      name: result.org.name,
      stripeCustomerId: result.org.stripeCustomerId,
    };
  });
