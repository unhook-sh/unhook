import { clerkClient } from '@clerk/nextjs/server';
import type { TRPCRouterRecord } from '@trpc/server';
import { db } from '@unhook/db/client';
import { AuthCodes, OrgMembers, Orgs, Users } from '@unhook/db/schema';
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
          id: ctx.auth.userId,
          clerkId: ctx.auth.userId,
          email: emailAddress?.emailAddress ?? '',
          firstName: user.firstName ?? null,
          lastName: user.lastName ?? null,
          avatarUrl: user.imageUrl ?? null,
          lastLoggedInAt: new Date(),
        })
        .onConflictDoUpdate({
          target: Users.clerkId,
          set: {
            email: emailAddress?.emailAddress ?? '',
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            avatarUrl: user.imageUrl ?? null,
            lastLoggedInAt: new Date(),
            updatedAt: new Date(),
          },
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
          name: organization.name,
          createdByUserId: ctx.auth.userId,
          id: session.lastActiveOrganizationId,
        })
        .onConflictDoUpdate({
          target: Orgs.clerkOrgId,
          set: {
            name: organization.name,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!org) {
        throw new Error('Failed to create/update organization');
      }

      // Upsert organization member
      const [orgMember] = await db
        .insert(OrgMembers)
        .values({
          userId: ctx.auth.userId,
          orgId: org.id,
          role: 'admin',
        })
        .onConflictDoUpdate({
          target: [OrgMembers.userId, OrgMembers.orgId],
          set: {
            role: 'admin',
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!orgMember) {
        throw new Error('Failed to create/update organization member');
      }

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

      // Get organization details from Clerk
      const organization = await clerk.organizations.getOrganization({
        organizationId: authCode.orgId,
      });

      // Upsert user
      const [dbUser] = await db
        .insert(Users)
        .values({
          id: authCode.userId,
          clerkId: authCode.userId,
          email: emailAddress?.emailAddress ?? '',
          firstName: user.firstName ?? null,
          lastName: user.lastName ?? null,
          avatarUrl: user.imageUrl ?? null,
          lastLoggedInAt: new Date(),
        })
        .onConflictDoUpdate({
          target: Users.clerkId,
          set: {
            email: emailAddress?.emailAddress ?? '',
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            avatarUrl: user.imageUrl ?? null,
            lastLoggedInAt: new Date(),
            updatedAt: new Date(),
          },
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
          name: organization.name,
          createdByUserId: authCode.userId,
          id: authCode.orgId,
        })
        .onConflictDoUpdate({
          target: Orgs.clerkOrgId,
          set: {
            name: organization.name,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!org) {
        throw new Error('Failed to create/update organization');
      }

      // Upsert organization member
      const [orgMember] = await db
        .insert(OrgMembers)
        .values({
          userId: authCode.userId,
          orgId: org.id,
          role: 'admin',
        })
        .onConflictDoUpdate({
          target: [OrgMembers.userId, OrgMembers.orgId],
          set: {
            role: 'admin',
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!orgMember) {
        throw new Error('Failed to create/update organization member');
      }

      const response = {
        authToken: sessionToken.jwt,
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
