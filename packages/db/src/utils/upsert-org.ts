import { clerkClient } from '@clerk/nextjs/server';
import { generateRandomName } from '@unhook/id';
import { upsertCustomerByOrg } from '@unhook/stripe';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { db } from '../client';
import { ApiKeys, OrgMembers, Orgs } from '../schema';

type UpsertOrgParams = {
  clerkOrgId: string;
  name: string;
  userId: string;
  userEmail: string;
};

type UpsertOrgResult = {
  org: {
    id: string;
    name: string;
    stripeCustomerId: string;
  };
  apiKey: {
    id: string;
    key: string;
    name: string;
  };
};

// Helper function to create or update org membership
async function ensureOrgMembership({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  await db
    .insert(OrgMembers)
    .values({
      orgId,
      role: 'admin',
      userId,
    })
    .onConflictDoUpdate({
      set: {
        role: 'admin',
        updatedAt: new Date(),
      },
      target: [OrgMembers.userId, OrgMembers.orgId],
    });
}

// Helper function to create or get default API key
async function ensureDefaultApiKey({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const existingApiKey = await db.query.ApiKeys.findFirst({
    where: (apiKeys, { eq }) => eq(apiKeys.orgId, orgId),
  });

  if (existingApiKey) {
    return existingApiKey;
  }

  const [apiKey] = await db
    .insert(ApiKeys)
    .values({
      name: 'Default',
      orgId,
      userId,
    })
    .onConflictDoUpdate({
      set: {
        updatedAt: new Date(),
      },
      target: ApiKeys.key,
    })
    .returning();

  if (!apiKey) {
    throw new Error('Failed to create API key');
  }

  return apiKey;
}

// Helper function to create org in database
async function createOrgInDatabase({
  clerkOrgId,
  name,
  userId,
  stripeCustomerId,
}: {
  clerkOrgId: string;
  name: string;
  userId: string;
  stripeCustomerId: string;
}) {
  const [org] = await db
    .insert(Orgs)
    .values({
      clerkOrgId,
      createdByUserId: userId,
      id: clerkOrgId,
      name,
      stripeCustomerId,
    })
    .onConflictDoUpdate({
      set: {
        name,
        stripeCustomerId,
        updatedAt: new Date(),
      },
      target: Orgs.clerkOrgId,
    })
    .returning();

  if (!org) {
    throw new Error('Failed to upsert organization in database');
  }

  return org;
}

// Helper function to handle existing org found by name
async function handleExistingOrgByName({
  name,
  userId,
  stripeCustomer,
}: {
  name: string;
  userId: string;
  stripeCustomer: Stripe.Customer;
}): Promise<UpsertOrgResult> {
  const existingOrg = await db.query.Orgs.findFirst({
    where: (orgs, { eq, and }) =>
      and(eq(orgs.name, name), eq(orgs.createdByUserId, userId)),
  });

  if (!existingOrg) {
    throw new Error('No existing organization found');
  }

  // Update existing org with Stripe customer ID if not set
  if (!existingOrg.stripeCustomerId) {
    await db
      .update(Orgs)
      .set({
        stripeCustomerId: stripeCustomer.id,
        updatedAt: new Date(),
      })
      .where(eq(Orgs.id, existingOrg.id));
  }

  await ensureOrgMembership({ orgId: existingOrg.id, userId });
  const apiKey = await ensureDefaultApiKey({ orgId: existingOrg.id, userId });

  return {
    apiKey: {
      id: apiKey.id,
      key: apiKey.key,
      name: apiKey.name,
    },
    org: {
      id: existingOrg.id,
      name: existingOrg.name,
      stripeCustomerId: existingOrg.stripeCustomerId || stripeCustomer.id,
    },
  };
}

export async function upsertOrg({
  clerkOrgId,
  name,
  userId,
  userEmail,
}: UpsertOrgParams): Promise<UpsertOrgResult> {
  const client = await clerkClient();

  // Create or get Stripe customer using org-based upsert
  const stripeCustomer = await upsertCustomerByOrg({
    additionalMetadata: {
      orgName: name,
      userId,
    },
    email: userEmail,
    name, // Use temp ID if no clerkOrgId yet
    orgId: clerkOrgId || `temp-${userId}-${Date.now()}`,
  });

  if (!stripeCustomer) {
    throw new Error('Failed to create or get Stripe customer');
  }

  // If clerkOrgId is provided, update existing org
  if (clerkOrgId) {
    // Update org in Clerk
    const clerkOrg = await client.organizations.updateOrganization(clerkOrgId, {
      name,
      privateMetadata: {
        stripeCustomerId: stripeCustomer.id,
      },
    });

    if (!clerkOrg) {
      throw new Error('Failed to update organization in Clerk');
    }

    const org = await createOrgInDatabase({
      clerkOrgId: clerkOrg.id,
      name,
      stripeCustomerId: stripeCustomer.id,
      userId,
    });

    await ensureOrgMembership({ orgId: org.id, userId });
    const apiKey = await ensureDefaultApiKey({ orgId: org.id, userId });

    return {
      apiKey: {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
      },
      org: {
        id: clerkOrg.id,
        name: clerkOrg.name,
        stripeCustomerId: stripeCustomer.id,
      },
    };
  }

  // Create new org if no clerkOrgId provided
  const slug = generateRandomName();

  try {
    const clerkOrg = await client.organizations.createOrganization({
      createdBy: userId,
      name,
      slug,
    });

    if (!clerkOrg) {
      throw new Error('Failed to create organization in Clerk');
    }

    const org = await createOrgInDatabase({
      clerkOrgId: clerkOrg.id,
      name,
      stripeCustomerId: stripeCustomer.id,
      userId,
    });

    await ensureOrgMembership({ orgId: org.id, userId });
    const apiKey = await ensureDefaultApiKey({ orgId: org.id, userId });

    return {
      apiKey: {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
      },
      org: {
        id: clerkOrg.id,
        name: clerkOrg.name,
        stripeCustomerId: stripeCustomer.id,
      },
    };
  } catch (error) {
    // Handle case where organization with same slug already exists
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string;
      if (
        errorMessage.indexOf('slug') !== -1 ||
        errorMessage.indexOf('already exists') !== -1
      ) {
        return handleExistingOrgByName({ name, stripeCustomer, userId });
      }
    }

    // Re-throw the error if we can't handle it
    throw error;
  }
}
