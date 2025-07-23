'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { AuthCodes } from '@unhook/db/schema';
import { createSafeActionClient } from 'next-safe-action';

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

  // Use the upsertOrg utility function (now handles user creation automatically)

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
