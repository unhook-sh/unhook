'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { AuthCodes, OrgMembers, Orgs } from '@unhook/db/schema';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

export const createAuthCode = action.action(async () => {
  const user = await auth();

  if (!user.userId) {
    throw new Error('User not found');
  }

  if (!user.orgId) {
    throw new Error('Organization not found');
  }

  // First check for an existing unused and non-expired auth code
  const existingAuthCode = await db.query.AuthCodes.findFirst({
    where: (authCode, { and, eq, isNull, gt }) =>
      and(
        eq(authCode.userId, user.userId),
        eq(authCode.orgId, user.orgId as string),
        isNull(authCode.usedAt),
        gt(authCode.expiresAt, new Date()),
      ),
  });

  if (existingAuthCode) {
    return {
      isNew: false,
      authCode: existingAuthCode,
    };
  }

  // If no valid auth code exists, create a new one
  const [authCode] = await db
    .insert(AuthCodes)
    .values({
      userId: user.userId,
      orgId: user.orgId,
      sessionId: user.sessionId,
    })
    .returning();

  if (!authCode) {
    throw new Error('Failed to create auth code');
  }

  return {
    isNew: true,
    authCode,
  };
});

export const upsertOrg = action
  .schema(
    z.object({
      name: z.string().min(1),
      clerkOrgId: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { name, clerkOrgId } = parsedInput;
    const user = await auth();

    if (!user.userId) {
      throw new Error('User not found');
    }

    const client = await clerkClient();

    // If clerkOrgId is provided, update existing org
    if (clerkOrgId) {
      // Update org in Clerk
      const clerkOrg = await client.organizations.updateOrganization(
        clerkOrgId,
        {
          name,
        },
      );

      if (!clerkOrg) {
        throw new Error('Failed to update organization in Clerk');
      }

      // Upsert org in our database
      const [org] = await db
        .insert(Orgs)
        .values({
          id: clerkOrg.id,
          createdByUserId: user.userId,
          clerkOrgId: clerkOrg.id,
          name,
        })
        .onConflictDoUpdate({
          target: Orgs.clerkOrgId,
          set: {
            name,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!org) {
        throw new Error('Failed to upsert organization in database');
      }

      // Create org membership for the user
      await db
        .insert(OrgMembers)
        .values({
          userId: user.userId,
          orgId: org.id,
          role: 'admin',
        })
        .onConflictDoUpdate({
          target: [OrgMembers.userId, OrgMembers.orgId],
          set: {
            updatedAt: new Date(),
          },
        });

      return {
        id: clerkOrg.id,
        name: clerkOrg.name,
      };
    }

    // Create new org if no clerkOrgId provided
    const clerkOrg = await client.organizations.createOrganization({
      name,
      createdBy: user.userId,
    });

    if (!clerkOrg) {
      throw new Error('Failed to create organization in Clerk');
    }

    // Create org in our database
    const [org] = await db
      .insert(Orgs)
      .values({
        id: clerkOrg.id,
        createdByUserId: user.userId,
        clerkOrgId: clerkOrg.id,
        name,
      })
      .returning();

    if (!org) {
      // If database creation fails, we should clean up the Clerk org
      await client.organizations.deleteOrganization(clerkOrg.id);
      throw new Error('Failed to create organization in database');
    }

    // Create org membership for the user
    await db.insert(OrgMembers).values({
      userId: user.userId,
      orgId: org.id,
      role: 'admin',
    });

    return {
      id: clerkOrg.id,
      name: clerkOrg.name,
    };
  });
