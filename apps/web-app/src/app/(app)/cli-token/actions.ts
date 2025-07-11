'use server';

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { AuthCodes, OrgMembers, Orgs, Users } from '@unhook/db/schema';
import { generateRandomName } from '@unhook/id';
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

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error('User details not found');
  }

  // Upsert user
  const [dbUser] = await db
    .insert(Users)
    .values({
      avatarUrl: clerkUser.imageUrl ?? null,
      clerkId: user.userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      firstName: clerkUser.firstName ?? null,
      id: user.userId,
      lastLoggedInAt: new Date(),
      lastName: clerkUser.lastName ?? null,
    })
    .onConflictDoUpdate({
      set: {
        avatarUrl: clerkUser.imageUrl ?? null,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        firstName: clerkUser.firstName ?? null,
        lastLoggedInAt: new Date(),
        lastName: clerkUser.lastName ?? null,
        updatedAt: new Date(),
      },
      target: Users.clerkId,
    })
    .returning();

  if (!dbUser) {
    throw new Error('Failed to create/update user');
  }

  const clerk = await clerkClient();
  const clerkOrg = await clerk.organizations.getOrganization({
    organizationId: user.orgId,
  });

  // Upsert organization
  const [org] = await db
    .insert(Orgs)
    .values({
      clerkOrgId: user.orgId,
      createdByUserId: user.userId,
      id: user.orgId,
      name: clerkOrg.name,
    })
    .onConflictDoUpdate({
      set: {
        name: clerkOrg.name,
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
      userId: user.userId,
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
      authCode: existingAuthCode,
      isNew: false,
    };
  }

  console.log('creating auth code', user.orgId, user.userId, user.sessionId);
  // If no valid auth code exists, create a new one
  const [authCode] = await db
    .insert(AuthCodes)
    .values({
      orgId: user.orgId,
      sessionId: user.sessionId,
      userId: user.userId,
    })
    .returning();

  if (!authCode) {
    throw new Error('Failed to create auth code');
  }

  return {
    authCode,
    isNew: true,
  };
});

export const upsertOrg = action
  .inputSchema(
    z.object({
      clerkOrgId: z.string().optional(),
      name: z.string().min(1),
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
          clerkOrgId: clerkOrg.id,
          createdByUserId: user.userId,
          id: clerkOrg.id,
          name,
        })
        .onConflictDoUpdate({
          set: {
            name,
            updatedAt: new Date(),
          },
          target: Orgs.clerkOrgId,
        })
        .returning();

      if (!org) {
        throw new Error('Failed to upsert organization in database');
      }

      // Create org membership for the user
      await db
        .insert(OrgMembers)
        .values({
          orgId: org.id,
          role: 'admin',
          userId: user.userId,
        })
        .onConflictDoUpdate({
          set: {
            updatedAt: new Date(),
          },
          target: [OrgMembers.userId, OrgMembers.orgId],
        });

      return {
        id: clerkOrg.id,
        name: clerkOrg.name,
      };
    }

    // Create new org if no clerkOrgId provided
    const slug = generateRandomName();
    const clerkOrg = await client.organizations.createOrganization({
      createdBy: user.userId,
      name,
      slug,
    });

    if (!clerkOrg) {
      throw new Error('Failed to create organization in Clerk');
    }

    // Create org in our database
    const [org] = await db
      .insert(Orgs)
      .values({
        clerkOrgId: clerkOrg.id,
        createdByUserId: user.userId,
        id: clerkOrg.id,
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
      orgId: org.id,
      role: 'admin',
      userId: user.userId,
    });

    return {
      id: clerkOrg.id,
      name: clerkOrg.name,
    };
  });
