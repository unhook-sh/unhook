import { auth } from '@clerk/nextjs/server';

import { db } from '@unhook/db/client';

export const createTRPCContext = async () => {
  let authResult: Awaited<ReturnType<typeof auth>> | null = null;
  try {
    authResult = await auth();
  } catch (error) {
    console.error('Error authenticating', error);
  }

  // NOTE(seawatts): we have to do this because the clerk session claims
  // are not always available in the request context when calling from the cli
  if (authResult?.sessionClaims?.org_id) {
    authResult.orgId = authResult.sessionClaims.org_id;
  }

  return {
    auth: authResult,
    db,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
