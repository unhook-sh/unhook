'use server';

import { auth } from '@clerk/nextjs/server';
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

  const [authCode] = await db
    .insert(AuthCodes)
    .values({
      userId: user.userId,
      orgId: user.orgId,
      sessionId: user.sessionId,
    })
    .returning();

  if (!authCode) {
    throw new Error('Failed to create auth code');
  }

  return authCode;
});
