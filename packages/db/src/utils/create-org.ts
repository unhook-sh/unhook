import {
  clerkClient,
  type Organization,
  type User,
} from '@clerk/nextjs/server';
import { generateRandomName } from '@unhook/id';
import {
  BILLING_INTERVALS,
  createSubscription,
  getFreePlanPriceId,
  PLAN_TYPES,
  upsertStripeCustomer,
} from '@unhook/stripe';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { db } from '../client';
import { ApiKeys, Orgs, Users } from '../schema';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type CreateOrgParams = {
  name: string;
  userId: string;
};

type CreateOrgResult = {
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
    throw new Error(
      `Failed to create user for userId: ${userId}, email: ${userEmail}`,
    );
  }

  return dbUser;
}

// Helper function to create default API key
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
    .returning();

  if (!apiKey) {
    throw new Error(
      `Failed to create API key for orgId: ${orgId}, userId: ${userId}`,
    );
  }

  return apiKey;
}

// Helper function to create org in database
async function createOrgInDatabase({
  clerkOrgId,
  name,
  userId,
  tx,
}: {
  clerkOrgId: string;
  name: string;
  userId: string;
  tx: Transaction;
}) {
  const [org] = await tx
    .insert(Orgs)
    .values({
      clerkOrgId,
      createdByUserId: userId,
      id: clerkOrgId,
      name,
    })
    .returning();

  if (!org) {
    throw new Error(
      `Failed to create organization for clerkOrgId: ${clerkOrgId}, name: ${name}, userId: ${userId}`,
    );
  }

  return org;
}

// Helper function to update org with Stripe customer ID
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

// Helper function to auto-subscribe to free plan
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
    if (!freePriceId) {
      console.error(
        `Failed to get free plan price ID for orgId: ${orgId}, customerId: ${customerId}`,
      );
      return null;
    }

    // Create subscription to free plan
    const subscription = await createSubscription({
      billingInterval: BILLING_INTERVALS.MONTHLY,
      customerId,
      orgId,
      planType: PLAN_TYPES.FREE,
      priceId: freePriceId,
    });

    if (!subscription) {
      console.error(
        `Failed to create subscription for orgId: ${orgId}, customerId: ${customerId}, priceId: ${freePriceId}`,
      );
      return null;
    }

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

    console.log(
      `Auto-subscribed org ${orgId} to free plan with subscription ${subscription.id}`,
    );
    return subscription;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `Failed to auto-subscribe to free plan for orgId: ${orgId}, customerId: ${customerId}. Original error: ${error.message}`,
      );
    } else {
      console.error(
        `Failed to auto-subscribe to free plan for orgId: ${orgId}, customerId: ${customerId}`,
      );
    }
    // Don't throw error - org creation should still succeed
    return null;
  }
}

/**
 * Creates a new organization with Stripe integration and API key
 * This function is specifically designed for onboarding new users
 */
export async function createOrg({
  name,
  userId,
}: CreateOrgParams): Promise<CreateOrgResult> {
  return await db.transaction(async (tx) => {
    // Run Clerk client initialization and user existence check in parallel
    const [client, existingUser] = await Promise.all([
      clerkClient(),
      tx.query.Users.findFirst({
        where: eq(Users.id, userId),
      }),
    ]);

    let user: User;
    let userEmail: string;

    try {
      user = await client.users.getUser(userId);
      const emailAddress = user.primaryEmailAddress?.emailAddress;
      if (!emailAddress) {
        throw new Error(`User email not found for userId: ${userId}`);
      }
      userEmail = emailAddress;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to retrieve user from Clerk for userId: ${userId}. Original error: ${error.message}`,
        );
      }
      throw new Error(
        `Failed to retrieve user from Clerk for userId: ${userId}`,
      );
    }

    // Ensure user exists in database before proceeding (only if user doesn't exist)
    if (!existingUser) {
      await ensureUserExists({
        tx,
        userAvatarUrl: user.imageUrl,
        userEmail,
        userFirstName: user.firstName,
        userId,
        userLastName: user.lastName,
      });
    }

    // Check if organization name already exists in database
    const existingOrgByName = await tx.query.Orgs.findFirst({
      where: eq(Orgs.name, name),
    });

    if (existingOrgByName) {
      throw new Error(
        `Organization name "${name}" is already taken. Please choose a different name.`,
      );
    }

    // Generate unique slug
    const slug = generateRandomName();
    let clerkOrg: Organization;

    try {
      clerkOrg = await client.organizations.createOrganization({
        createdBy: userId,
        name,
        slug,
      });

      if (!clerkOrg) {
        throw new Error(
          `Failed to create organization in Clerk for name: ${name}, slug: ${slug}, userId: ${userId}`,
        );
      }
    } catch (error: unknown) {
      // Handle case where organization with same slug already exists
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        if (
          errorMessage.indexOf('slug') !== -1 ||
          errorMessage.indexOf('already exists') !== -1
        ) {
          throw new Error(
            `Organization slug "${slug}" is already taken. Please try again.`,
          );
        }
      }

      // For other errors, throw immediately
      if (error instanceof Error) {
        throw new Error(
          `Failed to create organization in Clerk for name: ${name}, userId: ${userId}. Original error: ${error.message}`,
        );
      }
      throw new Error(
        `Failed to create organization in Clerk for name: ${name}, userId: ${userId}`,
      );
    }

    // Ensure clerkOrg is assigned
    if (!clerkOrg) {
      throw new Error('Failed to create organization in Clerk');
    }

    // Final check: Double-check that the organization wasn't created by another process
    const finalCheckOrg = await tx.query.Orgs.findFirst({
      where: eq(Orgs.clerkOrgId, clerkOrg.id),
    });

    if (finalCheckOrg) {
      console.log(
        'Organization was created by another process (likely webhook), using existing org:',
        finalCheckOrg.id,
      );

      // Get or create API key for existing org
      const apiKey = await ensureDefaultApiKey({
        orgId: finalCheckOrg.id,
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
          id: finalCheckOrg.clerkOrgId,
          name: finalCheckOrg.name,
          stripeCustomerId: finalCheckOrg.stripeCustomerId || '',
        },
      };
    }

    // Create org in database
    const org = await createOrgInDatabase({
      clerkOrgId: clerkOrg.id,
      name,
      tx,
      userId,
    });

    // Create or update Stripe customer
    console.log(
      'Creating/updating Stripe customer for org:',
      org.id,
      'name:',
      name,
    );

    let stripeCustomer: Stripe.Customer;
    try {
      stripeCustomer = await upsertStripeCustomer({
        additionalMetadata: {
          orgName: name,
          userId,
        },
        email: userEmail,
        name,
        orgId: org.id,
      });
      if (!stripeCustomer) {
        throw new Error(
          `Failed to create or get Stripe customer for orgId: ${org.id}, name: ${name}, email: ${userEmail}`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to create or get Stripe customer for orgId: ${org.id}, name: ${name}, email: ${userEmail}. Original error: ${error.message}`,
        );
      }
      throw new Error(
        `Failed to create or get Stripe customer for orgId: ${org.id}, name: ${name}, email: ${userEmail}`,
      );
    }

    console.log(
      'Stripe customer created/updated:',
      stripeCustomer.id,
      'for org:',
      org.id,
    );

    // Run database updates and Clerk update in parallel
    await Promise.all([
      // Update org in database with Stripe customer ID
      updateOrgWithStripeCustomerId({
        orgId: org.id,
        stripeCustomerId: stripeCustomer.id,
        tx,
      }),
      // Update org in Clerk with Stripe customer ID
      client.organizations.updateOrganization(clerkOrg.id, {
        name,
        privateMetadata: {
          stripeCustomerId: stripeCustomer.id,
        },
      }),
    ]);

    // Fetch the updated organization to get the latest data including Stripe customer ID
    const updatedOrg = await tx.query.Orgs.findFirst({
      where: eq(Orgs.id, org.id),
    });

    if (!updatedOrg) {
      throw new Error(
        `Failed to fetch updated organization with ID: ${org.id}`,
      );
    }

    // Auto-subscribe to free plan
    await autoSubscribeToFreePlan({
      customerId: stripeCustomer.id,
      orgId: updatedOrg.id,
      tx,
    });

    // Create default API key
    const apiKey = await ensureDefaultApiKey({
      orgId: updatedOrg.id,
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
        id: updatedOrg.clerkOrgId,
        name: updatedOrg.name,
        stripeCustomerId: updatedOrg.stripeCustomerId || '',
      },
    };
  });
}
