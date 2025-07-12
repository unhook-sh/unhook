import { createTRPCClient } from '@trpc/client';
import { type ClientConfig, createDefaultLinks } from './react/config';
import type { AppRouter } from './root';

export type ApiClient = ReturnType<typeof createClient>;

export const createClient = (config?: ClientConfig) => {
  return createTRPCClient<AppRouter>({
    links: createDefaultLinks({
      authToken: config?.authToken,
      baseUrl: config?.baseUrl,
      sessionCookie: config?.sessionCookie,
      sourceHeader: config?.sourceHeader,
    }),
  });
};
