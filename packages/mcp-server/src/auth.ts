import { auth, clerkClient } from '@clerk/nextjs/server';
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
  if (!bearerToken) return undefined;

  try {
    // Create a mock request with the authorization header
    const mockHeaders = new Headers(req.headers);
    mockHeaders.set('Authorization', `Bearer ${bearerToken}`);

    // Try to authenticate the request with Clerk
    const authResult = auth();

    if (!authResult?.userId) {
      // If standard auth fails, try to decode the JWT as a CLI token
      // CLI tokens are issued with a specific template and can be verified differently
      try {
        const clerk = clerkClient();

        // Get all active sessions to find one that matches our token
        const sessions = await clerk.sessions.getSessionList({
          userId: authResult?.userId || undefined,
        });

        for (const session of sessions.data) {
          try {
            const sessionToken = await clerk.sessions.getToken(
              session.id,
              'cli',
            );
            if (sessionToken?.jwt === bearerToken) {
              // Found matching session
              const user = await clerk.users.getUser(session.userId);
              const primaryEmail = user.emailAddresses.find(
                (email) => email.id === user.primaryEmailAddressId,
              );

              return {
                clientId: user.id,
                extra: {
                  email: primaryEmail?.emailAddress || undefined,
                  firstName: user.firstName || undefined,
                  lastName: user.lastName || undefined,
                  orgId: authResult.orgId || undefined,
                  permissions: [],
                  role: 'user',
                  sessionId: session.id,
                  timestamp: new Date().toISOString(),
                  userId: user.id,
                },
                scopes: [
                  'read:webhooks',
                  'write:webhooks',
                  'read:events',
                  'write:events',
                ],
                token: bearerToken,
              };
            }
          } catch {
            // Continue to next session
          }
        }
      } catch (error) {
        log('Failed to verify CLI token:', error);
      }

      return undefined;
    }

    // Get user information from Clerk
    const clerk = clerkClient();
    const user = await clerk.users.getUser(authResult.userId);

    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    );

    return {
      clientId: authResult.userId,
      extra: {
        email: primaryEmail?.emailAddress || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        orgId: authResult.orgId || undefined,
        permissions: authResult.sessionClaims?.org_permissions || [],
        role: authResult.sessionClaims?.org_role || 'user',
        sessionId: authResult.sessionId,
        timestamp: new Date().toISOString(),
        userId: authResult.userId,
      },
      scopes: [
        'read:webhooks',
        'write:webhooks',
        'read:events',
        'write:events',
      ],
      token: bearerToken,
    };
  } catch (error) {
    log('Failed to verify token:', error);
    return undefined;
  }
};
