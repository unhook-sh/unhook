import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { debug } from '@unhook/logger';

const log = debug('unhook:mcp-server:auth');

export type Extra = {
  email?: string;
  firstName?: string;
  lastName?: string;
  orgId?: string;
  permissions: string[];
  role: string;
  sessionId: string;
  timestamp: string;
  userId: string;
};

export const verifyToken = async (
  req: Request,
  bearerToken?: string,
): Promise<(AuthInfo & { extra: Extra }) | undefined> => {
  // Prefer explicit x-api-key header if present; otherwise use provided bearer token
  const headerApiKey =
    req.headers.get('x-api-key') || req.headers.get('X-API-Key') || undefined;
  const token = headerApiKey ?? bearerToken;
  if (!token) return undefined;

  try {
    // Make a direct HTTP request to verify the token instead of using the API client
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://unhook.sh';
    const response = await fetch(`${apiUrl}/api/trpc/auth.verifySessionToken`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      const result = data.result?.data;

      if (result?.user) {
        // Valid token - return auth info
        return {
          clientId: result.user.id,
          extra: {
            email: result.user.emailAddresses?.[0]?.emailAddress,
            firstName: result.user.firstName || undefined,
            lastName: result.user.lastName || undefined,
            orgId: result.user.orgId || undefined,
            permissions: [],
            role: 'user',
            sessionId: `api-token-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: result.user.id,
          },
          scopes: [
            'read:webhooks',
            'write:webhooks',
            'read:events',
            'write:events',
          ],
          token,
        };
      }
    }

    return undefined;
  } catch (error) {
    log('Failed to verify token:', error);
    return undefined;
  }
};
