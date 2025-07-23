import { clerkClient, type Organization } from '@clerk/nextjs/server';
import { generateRandomName } from '@unhook/id';
import {
  BILLING_INTERVALS,
  createSubscription,
  getFreePlanPriceId,
  PLAN_TYPES,
  upsertStripeCustomer,
} from '@unhook/stripe';
import { and, eq } from 'drizzle-orm';
import { db } from '../client';
import { ApiKeys, OrgMembers, Orgs, Users, Webhooks } from '../schema';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type UpsertOrgParams = {
  orgId?: string;
  name: string;
  userId: string;
};

type UpsertOrgResult = {
  webhook: {
    id: string;
    name: string;
    orgId: string;
    userId: string;
    isNew: boolean;
    apiKeyId: string;
    isPrivate: boolean;
  };
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

async function ensureWebhook({
  orgId,
  apiKeyId,
  userId,
  tx,
}: {
  orgId: string;
  userId: string;
  apiKeyId: string;
  tx: Transaction;
}) {
  const existingWebhook = await tx.query.Webhooks.findFirst({
    where: eq(Webhooks.orgId, orgId),
  });

  if (existingWebhook) {
    return {
      isNew: false,
      webhook: existingWebhook,
    };
  }

  const [webhook] = await tx
    .insert(Webhooks)
    .values({
      apiKeyId,
      name: 'Default',
      orgId,
      userId,
    })
    .returning();

  if (!webhook) {
    throw new Error('Failed to create webhook');
  }

  return {
    isNew: true,
    webhook,
  };
}

// Helper function to create or update org membership
async function ensureOrgMembership({
  orgId,
  userId,
  tx,
}: {
  orgId: string;
  userId: string;
  tx: Transaction;
}) {
  await tx
    .insert(OrgMembers)
    .values({
      orgId,
      role: 'admin',
      userId,
    })
    .onConflictDoUpdate({
      set: {
        updatedAt: new Date(),
      },
      target: [OrgMembers.orgId, OrgMembers.userId],
    });
}

async function ensureDefaultApiKey({
  orgId,
  userId,
  tx,
}: {
  orgId: string;
  userId: string;
  tx: Transaction;
}) {
  const existingApiKey = await tx.query.ApiKeys.findFirst({
    where: eq(ApiKeys.orgId, orgId),
  });

  if (existingApiKey) {
    return existingApiKey;
  }

  const [apiKey] = await tx
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

async function upsertOrgInDatabase({
  clerkOrgId,
  name,
  userId,
  stripeCustomerId,
  tx,
}: {
  clerkOrgId: string;
  name: string;
  userId: string;
  stripeCustomerId?: string;
  tx: Transaction;
}) {
  const [org] = await tx
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
      target: [Orgs.clerkOrgId],
    })
    .returning();

  if (!org) {
    throw new Error('Failed to create or update organization');
  }

  return org;
}

async function updateOrgWithStripeCustomerId({
  orgId,
  stripeCustomerId,
  tx,
}: {
  orgId: string;
  stripeCustomerId: string;
  tx: Transaction;
}) {
  await tx
    .update(Orgs)
    .set({
      stripeCustomerId,
      updatedAt: new Date(),
    })
    .where(eq(Orgs.id, orgId));
}

async function handleExistingOrgByName({
  name,
  userId,
  tx,
}: {
  name: string;
  userId: string;
  tx: Transaction;
}): Promise<UpsertOrgResult> {
  // Try to find existing org by name
  const existingOrg = await db.query.Orgs.findFirst({
    where: and(eq(Orgs.name, name), eq(Orgs.createdByUserId, userId)),
  });

  if (existingOrg) {
    // Check if user is already a member
    const existingMembership = await db.query.OrgMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.orgId, existingOrg.id), eq(members.userId, userId)),
    });

    if (!existingMembership) {
      // Add user to existing org
      await ensureOrgMembership({
        orgId: existingOrg.id,
        tx,
        userId,
      });
    }

    // Get or create API key and webhook
    const apiKey = await ensureDefaultApiKey({
      orgId: existingOrg.id,
      tx,
      userId,
    });

    const webhook = await ensureWebhook({
      apiKeyId: apiKey.id,
      orgId: existingOrg.id,
      tx,
      userId,
    });

    return {
      apiKey: {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
      },
      org: {
        id: existingOrg.clerkOrgId,
        name: existingOrg.name,
        stripeCustomerId: existingOrg.stripeCustomerId || '',
      },
      webhook: {
        apiKeyId: webhook.webhook.apiKeyId,
        id: webhook.webhook.id,
        isNew: webhook.isNew,
        isPrivate: webhook.webhook.isPrivate,
        name: webhook.webhook.name,
        orgId: webhook.webhook.orgId,
        userId: webhook.webhook.userId,
      },
    };
  }

  // If no existing org found, throw error to retry with new slug
  throw new Error('No existing org found, retry with new slug');
}

async function autoSubscribeToFreePlan({
  customerId,
  orgId,
  tx,
}: {
  customerId: string;
  orgId: string;
  tx: Transaction;
}) {
  try {
    // Get the free plan price ID
    const freePriceId = await getFreePlanPriceId();

    // Create subscription to free plan
    const subscription = await createSubscription({
      billingInterval: BILLING_INTERVALS.MONTHLY,
      customerId,
      orgId,
      planType: PLAN_TYPES.FREE,
      priceId: freePriceId,
    });

    // Update org with subscription info
    await tx
      .update(Orgs)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        updatedAt: new Date(),
      })
      .where(eq(Orgs.id, orgId));

    console.log(`Auto-subscribed org ${orgId} to free plan`);
    return subscription;
  } catch (error) {
    console.error('Failed to auto-subscribe to free plan:', error);
    // Don't throw error - org creation should still succeed
    return null;
  }
}

// Helper function to ensure user exists in database
async function ensureUserExists({
  userId,
  userEmail,
  userFirstName,
  userLastName,
  userAvatarUrl,
  tx,
}: {
  userId: string;
  userEmail: string;
  userFirstName?: string | null;
  userLastName?: string | null;
  userAvatarUrl?: string | null;
  tx: Transaction;
}) {
  const existingUser = await tx.query.Users.findFirst({
    where: eq(Users.id, userId),
  });

  if (existingUser) {
    return existingUser;
  }

  const [dbUser] = await tx
    .insert(Users)
    .values({
      avatarUrl: userAvatarUrl ?? null,
      clerkId: userId,
      email: userEmail,
      firstName: userFirstName ?? null,
      id: userId,
      lastLoggedInAt: new Date(),
      lastName: userLastName ?? null,
    })
    .onConflictDoUpdate({
      set: {
        avatarUrl: userAvatarUrl ?? null,
        email: userEmail,
        firstName: userFirstName ?? null,
        lastLoggedInAt: new Date(),
        lastName: userLastName ?? null,
        updatedAt: new Date(),
      },
      target: Users.clerkId,
    })
    .returning();

  if (!dbUser) {
    throw new Error('Failed to create user');
  }

  return dbUser;
}

export async function upsertOrg({
  orgId,
  name,
  userId,
}: UpsertOrgParams): Promise<UpsertOrgResult> {
  return await db.transaction(async (tx) => {
    // First, check if user already has an org membership
    const existingMembership = await tx.query.OrgMembers.findFirst({
      where: eq(OrgMembers.userId, userId),
    });

    if (existingMembership && !orgId) {
      // User already has an org, return existing data
      const existingOrg = await tx.query.Orgs.findFirst({
        where: eq(Orgs.id, existingMembership.orgId),
      });

      if (existingOrg) {
        const apiKey = await tx.query.ApiKeys.findFirst({
          where: eq(ApiKeys.orgId, existingOrg.id),
        });

        const webhook = await tx.query.Webhooks.findFirst({
          where: eq(Webhooks.orgId, existingOrg.id),
        });

        if (apiKey && webhook) {
          return {
            apiKey: {
              id: apiKey.id,
              key: apiKey.key,
              name: apiKey.name,
            },
            org: {
              id: existingOrg.clerkOrgId,
              name: existingOrg.name,
              stripeCustomerId: existingOrg.stripeCustomerId || '',
            },
            webhook: {
              apiKeyId: webhook.apiKeyId,
              id: webhook.id,
              isNew: false,
              isPrivate: webhook.isPrivate,
              name: webhook.name,
              orgId: webhook.orgId,
              userId: webhook.userId,
            },
          };
        }
      }
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) {
      throw new Error('User email not found');
    }

    // Ensure user exists in database before proceeding
    await ensureUserExists({
      tx,
      userAvatarUrl: user.imageUrl,
      userEmail,
      userFirstName: user.firstName,
      userId,
      userLastName: user.lastName,
    });

    let clerkOrg: Organization;
    let slug: string | undefined;

    if (orgId) {
      // Update org in Clerk
      clerkOrg = await client.organizations.updateOrganization(orgId, { name });
      if (!clerkOrg) throw new Error('Failed to update organization in Clerk');
    } else {
      // Create new org in Clerk
      slug = generateRandomName();
      try {
        clerkOrg = await client.organizations.createOrganization({
          createdBy: userId,
          name,
          slug,
        });
        if (!clerkOrg)
          throw new Error('Failed to create organization in Clerk');
      } catch (error: unknown) {
        // Handle case where organization with same slug already exists
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = (error as { message: string }).message;
          if (
            errorMessage.indexOf('slug') !== -1 ||
            errorMessage.indexOf('already exists') !== -1
          ) {
            return handleExistingOrgByName({ name, tx, userEmail, userId });
          }
        }
        throw error;
      }
    }

    // Upsert org in database (no Stripe customer ID initially)
    const org = await upsertOrgInDatabase({
      clerkOrgId: clerkOrg.id,
      name,
      tx,
      userId,
    });

    // Create or update Stripe customer
    const stripeCustomer = await upsertStripeCustomer({
      additionalMetadata: {
        orgName: name,
        userId,
      },
      email: userEmail,
      name,
      orgId: org.id,
    });
    if (!stripeCustomer)
      throw new Error('Failed to create or get Stripe customer');

    // Update org in database with Stripe customer ID
    await updateOrgWithStripeCustomerId({
      orgId: org.id,
      stripeCustomerId: stripeCustomer.id,
      tx,
    });

    // Auto-subscribe to free plan only if org doesn't already have a subscription
    if (!org.stripeSubscriptionId) {
      await autoSubscribeToFreePlan({
        customerId: stripeCustomer.id,
        orgId: org.id,
        tx,
      });
    }

    // Update org in Clerk with Stripe customer ID
    await client.organizations.updateOrganization(clerkOrg.id, {
      name,
      privateMetadata: {
        stripeCustomerId: stripeCustomer.id,
      },
    });

    await ensureOrgMembership({ orgId: org.id, tx, userId });
    const apiKey = await ensureDefaultApiKey({ orgId: org.id, tx, userId });
    const webhook = await ensureWebhook({
      apiKeyId: apiKey.id,
      orgId: org.id,
      tx,
      userId,
    });

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
      webhook: {
        apiKeyId: webhook.webhook.apiKeyId,
        id: webhook.webhook.id,
        isNew: webhook.isNew,
        isPrivate: webhook.webhook.isPrivate,
        name: webhook.webhook.name,
        orgId: webhook.webhook.orgId,
        userId: webhook.webhook.userId,
      },
    };
  });
}
