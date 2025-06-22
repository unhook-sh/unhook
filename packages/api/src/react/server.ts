import 'server-only';

import { createServerSideHelpers } from '@trpc/react-query/server';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { cache } from 'react';
import superjson from 'superjson';
import { createTRPCContext } from '../context';
import { appRouter } from '../root';
import { createQueryClient } from './query-client';

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set('x-trpc-source', 'rsc');

  const request = new NextRequest('https://notused.com', {
    headers: heads,
  });

  return createTRPCContext(request);
});

export const getQueryClient = cache(createQueryClient);

export const getApi = cache(async () =>
  createServerSideHelpers({
    ctx: await createContext(),
    queryClient: getQueryClient(),
    router: appRouter,
    transformer: superjson,
  }),
);
