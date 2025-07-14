import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@unhook/api';
import type { NextRequest } from 'next/server';

const handler = (request: NextRequest) =>
  fetchRequestHandler({
    createContext: () => createTRPCContext(),
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
  });

export { handler as GET, handler as POST };
