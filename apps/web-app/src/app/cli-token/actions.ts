'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { createSafeActionClient } from 'next-safe-action';

// Create the action client
const action = createSafeActionClient();

export const createClerkToken = action.action(async () => {
  const user = await auth();

  if (!user.userId) {
    throw new Error('User not found');
  }

  const clerk = await clerkClient();

  const token = await clerk.signInTokens.createSignInToken({
    expiresInSeconds: 60,
    userId: user.userId,
  });

  return {
    ticket: token.token,
    userId: user.userId,
    orgId: user.orgId,
    status: token.status,
    url: token.url,
    id: token.id,
  };
});
