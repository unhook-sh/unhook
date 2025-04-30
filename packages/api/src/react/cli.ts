import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '../root';
import { type ClientConfig, createDefaultLinks } from './config';

export const createClient = (config?: ClientConfig) => {
  return createTRPCClient<AppRouter>({
    links: createDefaultLinks({
      sourceHeader: config?.sourceHeader ?? 'cli-client',
      authToken: config?.authToken,
      sessionCookie: config?.sessionCookie,
    }),
  });
};
