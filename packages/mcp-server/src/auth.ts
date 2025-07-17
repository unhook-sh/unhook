import { auth, clerkClient } from '@clerk/nextjs/server';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { trackApiKeyUsage } from '@unhook/db';
import { db } from '@unhook/db/client';
import { ApiKeys } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { eq } from 'drizzle-orm';

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
    // First, check if this is an API key
    const apiKeyRecord = await db.query.ApiKeys.findFirst({
      where: eq(ApiKeys.key, bearerToken),
    });

    if (apiKeyRecord?.isActive) {
      // This is a valid API key, track usage
      await trackApiKeyUsage({
        apiKey: bearerToken,
        metadata: {},
        orgId: apiKeyRecord.orgId,
        type: 'mcp-server',
        userId: apiKeyRecord.userId,
      });

      // Return auth info for API key
      return {
        clientId: apiKeyRecord.userId,
        extra: {
          email: undefined, // API keys don't have email info
          firstName: undefined,
          lastName: undefined,
          orgId: apiKeyRecord.orgId,
          permissions: [],
          role: 'user',
          sessionId: `api-key-${apiKeyRecord.id}`,
          timestamp: new Date().toISOString(),
          userId: apiKeyRecord.userId,
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

    // Create a mock request with the authorization header
    const mockHeaders = new Headers(req.headers);
    mockHeaders.set('Authorization', `Bearer ${bearerToken}`);

    // Try to authenticate the request with Clerk
    const authResult = await auth();

    if (!authResult?.userId) {
      // If standard auth fails, try to decode the JWT as a CLI token
      // CLI tokens are issued with a specific template and can be verified differently
      try {
        const clerk = await clerkClient();

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
    const clerk = await clerkClient();
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
