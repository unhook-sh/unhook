import { clerkClient } from '@clerk/nextjs/server';
import type { TRPCRouterRecord } from '@trpc/server';
import { db } from '@unhook/db/client';
import { AuthCodes, OrgMembers, Orgs, Users } from '@unhook/db/schema';
import { and, eq, gte, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, publicProcedure } from '../trpc';

export const authRouter = {
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

      // Get organization details from Clerk
      const organization = await clerk.organizations.getOrganization({
        organizationId: authCode.orgId,
      });

      // Upsert user
      const [dbUser] = await db
        .insert(Users)
        .values({
          avatarUrl: user.imageUrl ?? null,
          clerkId: authCode.userId,
          email: emailAddress?.emailAddress ?? '',
          firstName: user.firstName ?? null,
          id: authCode.userId,
          lastLoggedInAt: new Date(),
          lastName: user.lastName ?? null,
        })
        .onConflictDoUpdate({
          set: {
            avatarUrl: user.imageUrl ?? null,
            email: emailAddress?.emailAddress ?? '',
            firstName: user.firstName ?? null,
            lastLoggedInAt: new Date(),
            lastName: user.lastName ?? null,
            updatedAt: new Date(),
          },
          target: Users.clerkId,
        })
        .returning();

      if (!dbUser) {
        throw new Error('Failed to create/update user');
      }

      // Upsert organization
      const [org] = await db
        .insert(Orgs)
        .values({
          clerkOrgId: authCode.orgId,
          createdByUserId: authCode.userId,
          id: authCode.orgId,
          name: organization.name,
        })
        .onConflictDoUpdate({
          set: {
            name: organization.name,
            updatedAt: new Date(),
          },
          target: Orgs.clerkOrgId,
        })
        .returning();

      if (!org) {
        throw new Error('Failed to create/update organization');
      }

      // Upsert organization member
      const [orgMember] = await db
        .insert(OrgMembers)
        .values({
          orgId: org.id,
          role: 'admin',
          userId: authCode.userId,
        })
        .onConflictDoUpdate({
          set: {
            role: 'admin',
            updatedAt: new Date(),
          },
          target: [OrgMembers.userId, OrgMembers.orgId],
        })
        .returning();

      if (!orgMember) {
        throw new Error('Failed to create/update organization member');
      }

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
    }),
  verifySessionToken: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(ctx.auth.userId);
      const session = await clerk.sessions.getSession(input.sessionId);
      const emailAddress = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId,
      );

      if (!session.lastActiveOrganizationId) {
        throw new Error('No active organization found');
      }

      // Get organization details from Clerk
      const organization = await clerk.organizations.getOrganization({
        organizationId: session.lastActiveOrganizationId,
      });

      // Upsert user
      const [dbUser] = await db
        .insert(Users)
        .values({
          avatarUrl: user.imageUrl ?? null,
          clerkId: ctx.auth.userId,
          email: emailAddress?.emailAddress ?? '',
          firstName: user.firstName ?? null,
          id: ctx.auth.userId,
          lastLoggedInAt: new Date(),
          lastName: user.lastName ?? null,
        })
        .onConflictDoUpdate({
          set: {
            avatarUrl: user.imageUrl ?? null,
            email: emailAddress?.emailAddress ?? '',
            firstName: user.firstName ?? null,
            lastLoggedInAt: new Date(),
            lastName: user.lastName ?? null,
            updatedAt: new Date(),
          },
          target: Users.clerkId,
        })
        .returning();

      if (!dbUser) {
        throw new Error('Failed to create/update user');
      }

      // Upsert organization
      const [org] = await db
        .insert(Orgs)
        .values({
          clerkOrgId: session.lastActiveOrganizationId,
          createdByUserId: ctx.auth.userId,
          id: session.lastActiveOrganizationId,
          name: organization.name,
        })
        .onConflictDoUpdate({
          set: {
            name: organization.name,
            updatedAt: new Date(),
          },
          target: Orgs.clerkOrgId,
        })
        .returning();

      if (!org) {
        throw new Error('Failed to create/update organization');
      }

      // Upsert organization member
      const [orgMember] = await db
        .insert(OrgMembers)
        .values({
          orgId: org.id,
          role: 'admin',
          userId: ctx.auth.userId,
        })
        .onConflictDoUpdate({
          set: {
            role: 'admin',
            updatedAt: new Date(),
          },
          target: [OrgMembers.userId, OrgMembers.orgId],
        })
        .returning();

      if (!orgMember) {
        throw new Error('Failed to create/update organization member');
      }

      return {
        orgId: session.lastActiveOrganizationId,
        user: {
          email: emailAddress?.emailAddress,
          fullName: user.fullName,
          id: ctx.auth.userId,
        },
      };
    }),
} satisfies TRPCRouterRecord;
