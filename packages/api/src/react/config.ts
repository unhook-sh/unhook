import { httpBatchStreamLink, loggerLink } from '@trpc/client';
import SuperJSON from 'superjson';
import { env } from '../env.client';

export const getBaseUrl = () => {
  if (typeof globalThis !== 'undefined' && globalThis.location)
    return globalThis.location.origin;
  if (env.NEXT_PUBLIC_API_URL) return env.NEXT_PUBLIC_API_URL;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const createDefaultLinks = ({
  sourceHeader,
  authToken,
  sessionCookie,
}: {
  sourceHeader?: string;
  authToken?: string;
  sessionCookie?: string;
} = {}) => [
  loggerLink({
    enabled: (op) =>
      env.NODE_ENV === 'development' ||
      (op.direction === 'down' && op.result instanceof Error),
  }),
  httpBatchStreamLink({
    headers() {
      const headers = new Headers();
      headers.set('x-trpc-source', sourceHeader ?? 'vanilla');

      if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
      }

      if (sessionCookie) {
        headers.set('Cookie', `__session=${sessionCookie}`);
      }

      return headers;
    },
    transformer: SuperJSON,
    url: `${getBaseUrl()}/api/trpc`,
  }),
];

export type ClientConfig = {
  sourceHeader?: string;
  authToken?: string;
  sessionCookie?: string;
};
