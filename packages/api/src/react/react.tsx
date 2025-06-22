'use client';

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';

import type { AppRouter } from '../root';
import { type ClientConfig, createDefaultLinks } from './config';
import { createQueryClient } from './query-client';

let clientQueryClientSingleton: QueryClient | undefined;
const getQueryClient = () => {
  if (typeof globalThis === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  }

  // Browser: use singleton pattern to keep the same query client
  if (!clientQueryClientSingleton) {
    clientQueryClientSingleton = createQueryClient();
  }
  return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(
  props: {
    children: React.ReactNode;
  } & ClientConfig,
) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: createDefaultLinks({
        sourceHeader: props.sourceHeader ?? 'nextjs-react',
        authToken: props.authToken,
      }),
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
