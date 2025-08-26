import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { upsertOrg } from '@unhook/db';
import { db } from '@unhook/db/client';
import { AuthCodes } from '@unhook/db/schema';
import { and, eq, gte, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, publicProcedure } from '../trpc';

export const authRouter = {
  exchangeAuthCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        sessionTemplate: z.enum(['cli', 'supabase']).default('cli'),
      }),
    )
    .mutation(async ({ input }) => {
      const { code } = input;

      const authCode = await db.transaction(async (tx) => {
        const foundCode = await tx.query.AuthCodes.findFirst({
          where: and(
            eq(AuthCodes.id, code),
            isNull(AuthCodes.usedAt),
            gte(AuthCodes.expiresAt, new Date()),
          ),
        });

        if (!foundCode) {
          return null;
        }

        await tx
          .update(AuthCodes)
          .set({
            usedAt: new Date(),
          })
          .where(eq(AuthCodes.id, code));

        return foundCode;
      });

      if (!authCode) {
        throw new TRPCError({
          cause: new Error(`Auth code validation failed for code: ${code}`),
          code: 'BAD_REQUEST',
          message: 'Invalid or expired authentication code',
        });
      }

      const clerk = await clerkClient();

      try {
        const sessionToken = await clerk.sessions.getToken(
          authCode.sessionId,
          input.sessionTemplate,
        );

        const user = await clerk.users.getUser(authCode.userId);

        if (!user) {
          throw new TRPCError({
            cause: new Error(`User not found for userId: ${authCode.userId}`),
            code: 'NOT_FOUND',
            message: 'User not found in Clerk',
          });
        }

        const emailAddress = user.emailAddresses.find(
          (email) => email.id === user.primaryEmailAddressId,
        );

        // Get organization details from Clerk
        const organization = await clerk.organizations.getOrganization({
          organizationId: authCode.orgId,
        });

        if (!organization) {
          throw new TRPCError({
            cause: new Error(
              `Organization not found for orgId: ${authCode.orgId}`,
            ),
            code: 'NOT_FOUND',
            message: 'Organization not found in Clerk',
          });
        }

        // Use the upsertOrg utility function (now handles user creation automatically)
        await upsertOrg({
          name: organization.name,
          orgId: authCode.orgId,
          userId: authCode.userId,
        });

        const response = {
          authToken: sessionToken.jwt,
          orgId: authCode.orgId,
          sessionId: authCode.sessionId,
          user: {
            email: emailAddress?.emailAddress,
            fullName: user.fullName,
            id: authCode.userId,
          },
        };
        return response;
      } catch (error) {
        // Handle Clerk API errors with detailed metadata
        if (error instanceof Error) {
          // Add context about what operation failed
          const errorContext = {
            authCode: code,
            operation: 'auth_code_exchange',
            orgId: authCode.orgId,
            originalError: error,
            sessionId: authCode.sessionId,
            sessionTemplate: input.sessionTemplate,
            userId: authCode.userId,
          };

          console.error(
            'An error occurred during auth code exchange:',
            errorContext,
          );

          // Check for specific Clerk API error patterns
          if (
            error.message.includes('not found') ||
            error.message.includes('404')
          ) {
            throw new TRPCError({
              cause: error,
              code: 'NOT_FOUND',
              message: 'User, session, or organization not found in Clerk',
            });
          }

          if (
            error.message.includes('unauthorized') ||
            error.message.includes('401')
          ) {
            throw new TRPCError({
              cause: error,
              code: 'UNAUTHORIZED',
              message: 'Unauthorized access to Clerk resources',
            });
          }

          if (
            error.message.includes('forbidden') ||
            error.message.includes('403')
          ) {
            throw new TRPCError({
              cause: error,
              code: 'FORBIDDEN',
              message: 'Access forbidden to Clerk resources',
            });
          }

          throw new TRPCError({
            cause: error,
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve user or organization data',
          });
        }
        throw new TRPCError({
          cause: new Error(
            `Unknown error during auth code exchange for code: ${code}, userId: ${authCode.userId}, orgId: ${authCode.orgId}`,
          ),
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'An unexpected error occurred while processing authentication',
        });
      }
    }),
  verifySessionToken: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        sessionTemplate: z.enum(['cli', 'supabase']).default('cli'),
      }),
    )
    .query(async ({ input, ctx }) => {
      const clerk = await clerkClient();

      try {
        const user = await clerk.users.getUser(ctx.auth.userId);

        if (!user) {
          throw new TRPCError({
            cause: new Error(`User not found for userId: ${ctx.auth.userId}`),
            code: 'NOT_FOUND',
            message: 'User not found in Clerk',
          });
        }

        const session = await clerk.sessions.getSession(input.sessionId);

        if (!session) {
          throw new TRPCError({
            cause: new Error(
              `Session not found for sessionId: ${input.sessionId}`,
            ),
            code: 'NOT_FOUND',
            message: 'Session not found in Clerk',
          });
        }
        const emailAddress = user.emailAddresses.find(
          (email) => email.id === user.primaryEmailAddressId,
        );

        if (!session.lastActiveOrganizationId) {
          throw new TRPCError({
            cause: new Error(
              `No active organization for session: ${input.sessionId}, userId: ${ctx.auth.userId}`,
            ),
            code: 'BAD_REQUEST',
            message: 'No active organization found for this session',
          });
        }

        // Get organization details from Clerk
        const organization = await clerk.organizations.getOrganization({
          organizationId: session.lastActiveOrganizationId,
        });

        if (!organization) {
          throw new TRPCError({
            cause: new Error(
              `Organization not found for orgId: ${session.lastActiveOrganizationId}`,
            ),
            code: 'NOT_FOUND',
            message: 'Organization not found in Clerk',
          });
        }

        // Use the upsertOrg utility function (now handles user creation automatically)
        await upsertOrg({
          name: organization.name,
          orgId: session.lastActiveOrganizationId,
          userId: ctx.auth.userId,
        });

        // Get a fresh Supabase JWT token for realtime connections
        const sessionToken = await clerk.sessions.getToken(
          input.sessionId,
          input.sessionTemplate,
        );

        return {
          authToken: sessionToken.jwt,
          orgId: session.lastActiveOrganizationId,
          orgName: organization.name,
          user: {
            email: emailAddress?.emailAddress,
            fullName: user.fullName,
            id: ctx.auth.userId,
          },
        };
      } catch (error) {
        // Handle Clerk API errors with detailed metadata
        if (error instanceof TRPCError) {
          throw error; // Re-throw TRPC errors as-is
        }
        if (error instanceof Error) {
          // Add context about what operation failed
          const errorContext = {
            operation: 'session_verification',
            originalError: error,
            sessionId: input.sessionId,
            sessionTemplate: input.sessionTemplate,
            userId: ctx.auth.userId,
          };

          console.error(
            'An error occurred during session verification:',
            errorContext,
          );

          // Check for specific Clerk API error patterns
          if (
            error.message.includes('not found') ||
            error.message.includes('404')
          ) {
            throw new TRPCError({
              cause: error,
              code: 'NOT_FOUND',
              message: 'User, session, or organization not found in Clerk',
            });
          }

          if (
            error.message.includes('unauthorized') ||
            error.message.includes('401')
          ) {
            throw new TRPCError({
              cause: error,
              code: 'UNAUTHORIZED',
              message: 'Unauthorized access to Clerk resources',
            });
          }

          if (
            error.message.includes('forbidden') ||
            error.message.includes('403')
          ) {
            throw new TRPCError({
              cause: error,
              code: 'FORBIDDEN',
              message: 'Access forbidden to Clerk resources',
            });
          }

          throw new TRPCError({
            cause: error,
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to verify session or retrieve user data',
          });
        }
        throw new TRPCError({
          cause: new Error(
            `Unknown error during session verification for sessionId: ${input.sessionId}, userId: ${ctx.auth.userId}`,
          ),
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while verifying session',
        });
      }
    }),
};
