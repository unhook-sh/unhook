import { clerkClient } from '@clerk/nextjs/server';
import { generateRandomName } from '@unhook/id';
import { upsertCustomerByOrg } from '@unhook/stripe';
import { eq } from 'drizzle-orm';
import { db } from '../client';
import { ApiKeys, OrgMembers, Orgs } from '../schema';

type UpsertOrgParams = {
  orgId?: string;
  name: string;
  userId: string;
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
  stripeCustomerId?: string;
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

// Helper function to update org with Stripe customer ID
async function updateOrgWithStripeCustomerId({
  orgId,
  stripeCustomerId,
}: {
  orgId: string;
  stripeCustomerId: string;
}) {
  await db
    .update(Orgs)
    .set({
      stripeCustomerId,
      updatedAt: new Date(),
    })
    .where(eq(Orgs.id, orgId));
}

// Helper function to handle existing org found by name
async function handleExistingOrgByName({
  name,
  userId,
  userEmail,
}: {
  name: string;
  userId: string;
  userEmail: string;
}): Promise<UpsertOrgResult> {
  const existingOrg = await db.query.Orgs.findFirst({
    where: (orgs, { eq, and }) =>
      and(eq(orgs.name, name), eq(orgs.createdByUserId, userId)),
  });

  if (!existingOrg) {
    throw new Error('No existing organization found');
  }

  // Create Stripe customer for existing org
  const stripeCustomer = await upsertCustomerByOrg({
    additionalMetadata: {
      orgName: name,
      userId,
    },
    email: userEmail,
    name,
    orgId: existingOrg.id,
  });

  if (!stripeCustomer) {
    throw new Error('Failed to create or get Stripe customer');
  }

  // Update existing org with Stripe customer ID
  await updateOrgWithStripeCustomerId({
    orgId: existingOrg.id,
    stripeCustomerId: stripeCustomer.id,
  });

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
      stripeCustomerId: stripeCustomer.id,
    },
  };
}

export async function upsertOrg({
  orgId,
  name,
  userId,
}: UpsertOrgParams): Promise<UpsertOrgResult> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail) {
    throw new Error('User email not found');
  }

  // If clerkOrgId is provided, update existing org
  if (orgId) {
    // Update org in Clerk first
    const clerkOrg = await client.organizations.updateOrganization(orgId, {
      name,
    });

    if (!clerkOrg) {
      throw new Error('Failed to update organization in Clerk');
    }

    // Create org in database without Stripe customer ID initially
    const org = await createOrgInDatabase({
      clerkOrgId: clerkOrg.id,
      name,
      userId,
    });

    // Create Stripe customer after org is created
    const stripeCustomer = await upsertCustomerByOrg({
      additionalMetadata: {
        orgName: name,
        userId,
      },
      email: userEmail,
      name,
      orgId: org.id,
    });

    if (!stripeCustomer) {
      throw new Error('Failed to create or get Stripe customer');
    }

    // Update org in database with Stripe customer ID
    await updateOrgWithStripeCustomerId({
      orgId: org.id,
      stripeCustomerId: stripeCustomer.id,
    });

    // Update org in Clerk with Stripe customer ID
    await client.organizations.updateOrganization(clerkOrg.id, {
      name,
      privateMetadata: {
        stripeCustomerId: stripeCustomer.id,
      },
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

    // Create org in database without Stripe customer ID initially
    const org = await createOrgInDatabase({
      clerkOrgId: clerkOrg.id,
      name,
      userId,
    });

    // Create Stripe customer after org is created
    const stripeCustomer = await upsertCustomerByOrg({
      additionalMetadata: {
        orgName: name,
        userId,
      },
      email: userEmail,
      name,
      orgId: org.id,
    });

    if (!stripeCustomer) {
      throw new Error('Failed to create or get Stripe customer');
    }

    // Update org in database with Stripe customer ID
    await updateOrgWithStripeCustomerId({
      orgId: org.id,
      stripeCustomerId: stripeCustomer.id,
    });

    // Update org in Clerk with Stripe customer ID
    await client.organizations.updateOrganization(clerkOrg.id, {
      privateMetadata: {
        stripeCustomerId: stripeCustomer.id,
      },
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
        return handleExistingOrgByName({ name, userEmail, userId });
      }
    }

    // Re-throw the error if we can't handle it
    throw error;
  }
}
