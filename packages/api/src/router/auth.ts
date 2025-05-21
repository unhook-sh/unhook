import { clerkClient } from '@clerk/nextjs/server';
import type { TRPCRouterRecord } from '@trpc/server';
import { db } from '@unhook/db/client';
import { AuthCodes } from '@unhook/db/schema';
import { and, eq, gte, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, publicProcedure } from '../trpc';

export const authRouter = {
  verifySessionToken: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(ctx.auth.userId);
      const session = await clerk.sessions.getSession(input.sessionId);
      const emailAddress = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId,
      );

      return {
        user: {
          id: ctx.auth.userId,
          email: emailAddress?.emailAddress,
          fullName: user.fullName,
        },
        orgId: session.lastActiveOrganizationId,
      };
    }),
  exchangeAuthCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
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
        throw new Error('Invalid auth code');
      }

      const clerk = await clerkClient();
      const sessionToken = await clerk.sessions.getToken(
        authCode.sessionId,
        'cli',
      );

      const user = await clerk.users.getUser(authCode.userId);
      const emailAddress = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId,
      );
      const response = {
        token: sessionToken.jwt,
        sessionId: authCode.sessionId,
        orgId: authCode.orgId,
        user: {
          id: authCode.userId,
          email: emailAddress?.emailAddress,
          fullName: user.fullName,
        },
      };
      return response;
    }),
} satisfies TRPCRouterRecord;
