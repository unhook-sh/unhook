import { httpBatchStreamLink, loggerLink } from '@trpc/client';
import SuperJSON from 'superjson';
import { env } from '../env.client.js';

export const getBaseUrl = () => {
  if (typeof globalThis !== 'undefined' && globalThis.location)
    return globalThis.location.origin;
  // Prefer runtime environment variable if available (helps VSCode extension and other
  // non-browser runtimes where we can set process.env at start-up)
  const runtimeEnv: Record<string, string> | undefined =
    // Narrow globalThis.process in non-Node environments safely
    typeof globalThis !== 'undefined' &&
    'process' in globalThis &&
    // @ts-expect-error – `process` is only available in Node environments. We
    // guard for its existence above so the cast is safe.
    (globalThis as { process: { env: Record<string, string> } }).process?.env;
  if (runtimeEnv?.NEXT_PUBLIC_API_URL) return runtimeEnv.NEXT_PUBLIC_API_URL;
  if (env.NEXT_PUBLIC_API_URL) return env.NEXT_PUBLIC_API_URL;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;

  return `http://localhost:${runtimeEnv?.PORT ?? 3000}`;
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
