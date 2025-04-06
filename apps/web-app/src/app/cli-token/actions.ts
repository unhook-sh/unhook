'use server';

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { createSafeActionClient } from 'next-safe-action';

// Create the action client
const action = createSafeActionClient();

export const createClerkToken = action.action(async () => {
  const user = await currentUser();

  if (!user) {
    throw new Error('User not found');
  }

  const clerk = await clerkClient();

  const token = await clerk.signInTokens.createSignInToken({
    expiresInSeconds: 60 * 60 * 24 * 30,
    userId: user?.id,
  });

  return {
    token: token.token,
    userId: user.id,
    status: token.status,
    url: token.url,
    id: token.id,
  };
});
