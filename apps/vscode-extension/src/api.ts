import type { RouterOutputs } from '@unhook/api';
import { createClient } from '@unhook/api/client';

export type ApiClient = ReturnType<typeof createClient>;
export type AuthUser = RouterOutputs['auth']['verifySessionToken']['user'];

export function createApiClient({
  authToken,
  baseUrl,
}: {
  authToken?: string;
  baseUrl?: string;
} = {}): ApiClient {
  return createClient({
    authToken,
    baseUrl,
    sessionCookie: authToken,
  });
}
