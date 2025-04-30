import { auth } from '@clerk/nextjs/server';

import { db } from '@unhook/db/client';
import type { NextRequest } from 'next/server';

export const createTRPCContext = async (_request: NextRequest) => {
  let authResult: Awaited<ReturnType<typeof auth>> | null = null;
  try {
    authResult = await auth();
  } catch (error) {
    console.error('Error authenticating', error);
  }

  return { auth: authResult, db };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
