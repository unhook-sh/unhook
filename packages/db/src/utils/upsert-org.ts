'server-only';

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
import { and, eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { db } from '../client';
import {
  ApiKeys,
  Events,
  OrgMembers,
  Orgs,
  Requests,
  Users,
  Webhooks,
} from '../schema';

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
    throw new Error(
      `Failed to create webhook for orgId: ${orgId}, userId: ${userId}, apiKeyId: ${apiKeyId}`,
    );
  }

  // Create example event and request for new webhooks
  try {
    await createExampleEventAndRequest({
      apiKeyId,
      orgId,
      tx,
      userId,
      webhookId: webhook.id,
    });
  } catch (error) {
    console.error('Failed to create example event and request:', error);
    // Don't fail the webhook creation if example data creation fails
  }

  return {
    isNew: true,
    webhook,
  };
}

// Helper function to create example event and request for new webhooks
async function createExampleEventAndRequest({
  webhookId,
  apiKeyId,
  orgId,
  userId,
  tx,
}: {
  webhookId: string;
  apiKeyId: string;
  orgId: string;
  userId: string;
  tx: Transaction;
}) {
  const exampleTimestamp = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes ago

  // Create example event
  const [exampleEvent] = await tx
    .insert(Events)
    .values({
      apiKeyId,
      orgId,
      originRequest: {
        body: JSON.stringify({
          data: {
            created_at: '2024-01-15T10:30:00Z',
            email: 'john@example.com',
            id: 'user_123',
            name: 'John Doe',
          },
          event: 'user.created',
        }),
        clientIp: '192.168.1.100',
        contentType: 'application/json',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'ExampleWebhookClient/1.0',
          'x-webhook-signature': 'sha256=abc123...',
        },
        id: 'example-request-123',
        method: 'POST',
        size: 245,
        sourceUrl: 'https://api.example.com/webhooks',
      },
      source: 'example',
      status: 'completed',
      timestamp: exampleTimestamp,
      userId,
      webhookId,
    })
    .returning();

  if (!exampleEvent) {
    throw new Error('Failed to create example event');
  }

  // Create example request
  const [exampleRequest] = await tx
    .insert(Requests)
    .values({
      apiKeyId,
      completedAt: new Date(exampleTimestamp.getTime() + 125), // 125ms later
      destination: {
        name: 'Local Development Server',
        url: 'http://localhost:3000/webhooks',
      },
      destinationName: 'Local Development Server',
      destinationUrl: 'http://localhost:3000/webhooks',
      eventId: exampleEvent.id,
      orgId,
      response: {
        body: JSON.stringify({
          message: 'Webhook received successfully',
          processed_at: '2024-01-15T10:30:01Z',
          success: true,
        }),
        headers: {
          'content-type': 'application/json',
          server: 'localhost:3000',
        },
        status: 200,
      },
      responseTimeMs: 125,
      source: 'example',
      status: 'completed',
      timestamp: exampleTimestamp,
      userId,
      webhookId,
    })
    .returning();

  if (!exampleRequest) {
    throw new Error('Failed to create example request');
  }

  console.log(
    `Created example event ${exampleEvent.id} and request ${exampleRequest.id} for webhook ${webhookId}`,
  );
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
    throw new Error(
      `Failed to create API key for orgId: ${orgId}, userId: ${userId}`,
    );
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
    throw new Error(
      `Failed to create or update organization for clerkOrgId: ${clerkOrgId}, name: ${name}, userId: ${userId}`,
    );
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
  try {
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
    throw new Error(
      `No existing org found for name: ${name}, userId: ${userId}, retry with new slug`,
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to handle existing org by name for name: ${name}, userId: ${userId}. Original error: ${error.message}`,
      );
    }
    throw new Error(
      `Failed to handle existing org by name for name: ${name}, userId: ${userId}`,
    );
  }
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

// Helper function to build the return result from existing org data
async function buildOrgResult({
  org,
  tx,
  userId,
}: {
  org: {
    id: string;
    clerkOrgId: string;
    name: string;
    stripeCustomerId: string | null;
  };
  tx: Transaction;
  userId: string;
}): Promise<UpsertOrgResult> {
  // Run membership and API key creation in parallel (webhook needs apiKey.id)
  const [_, apiKey] = await Promise.all([
    ensureOrgMembership({ orgId: org.id, tx, userId }),
    ensureDefaultApiKey({ orgId: org.id, tx, userId }),
  ]);

  // Now create webhook with the API key ID
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
      id: org.clerkOrgId,
      name: org.name,
      stripeCustomerId: org.stripeCustomerId || '',
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

// Helper function to check if we should use an existing organization
async function findExistingOrg({
  orgId,
  userId,
  tx,
}: {
  orgId?: string;
  userId: string;
  tx: Transaction;
}): Promise<{
  org: {
    id: string;
    clerkOrgId: string;
    name: string;
    stripeCustomerId: string | null;
  };
  reason: string;
} | null> {
  // Run all possible org existence checks in parallel
  const [existingMembership, existingOrgByOrgId, existingOrgByUser] =
    await Promise.all([
      // Check 1: User already has an org membership
      tx.query.OrgMembers.findFirst({
        where: eq(OrgMembers.userId, userId),
      }),
      // Check 2: If orgId is provided, check if organization already exists
      orgId
        ? tx.query.Orgs.findFirst({
            where: eq(Orgs.clerkOrgId, orgId),
          })
        : null,
      // Check 3: User has created any organization
      !orgId
        ? tx.query.Orgs.findFirst({
            where: eq(Orgs.createdByUserId, userId),
          })
        : null,
    ]);

  // Check 1: User already has an org membership
  if (existingMembership && !orgId) {
    const existingOrg = await tx.query.Orgs.findFirst({
      where: eq(Orgs.id, existingMembership.orgId),
    });

    if (existingOrg) {
      // Run API key and webhook checks in parallel
      const [apiKey, webhook] = await Promise.all([
        tx.query.ApiKeys.findFirst({
          where: eq(ApiKeys.orgId, existingOrg.id),
        }),
        tx.query.Webhooks.findFirst({
          where: eq(Webhooks.orgId, existingOrg.id),
        }),
      ]);

      if (apiKey && webhook) {
        return { org: existingOrg, reason: 'existing_membership' };
      }
    }
  }

  // Check 2: If orgId is provided, check if organization already exists
  if (existingOrgByOrgId) {
    console.log(
      'Organization already exists for orgId:',
      orgId,
      'using existing org:',
      existingOrgByOrgId.id,
    );
    return { org: existingOrgByOrgId, reason: 'existing_org_id' };
  }

  // Check 3: User has created any organization
  if (existingOrgByUser && !orgId) {
    console.log(
      'User already has an organization:',
      existingOrgByUser.id,
      'using existing org',
    );
    return { org: existingOrgByUser, reason: 'existing_user_org' };
  }

  return null;
}

export async function upsertOrg({
  orgId,
  name,
  userId,
}: UpsertOrgParams): Promise<UpsertOrgResult> {
  return await db.transaction(async (tx) => {
    // Check for existing organizations first
    const existingOrgResult = await findExistingOrg({ orgId, tx, userId });
    if (existingOrgResult) {
      return buildOrgResult({
        org: existingOrgResult.org,
        tx,
        userId,
      });
    }

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

    let clerkOrg: Organization;
    let slug: string | undefined;

    if (orgId) {
      // Update org in Clerk
      try {
        clerkOrg = await client.organizations.updateOrganization(orgId, {
          name,
        });
        if (!clerkOrg) {
          throw new Error(
            `Failed to update organization in Clerk for orgId: ${orgId}, name: ${name}`,
          );
        }
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(
            `Failed to update organization in Clerk for orgId: ${orgId}, name: ${name}. Original error: ${error.message}`,
          );
        }
        throw new Error(
          `Failed to update organization in Clerk for orgId: ${orgId}, name: ${name}`,
        );
      }
    } else {
      // Create new org in Clerk
      slug = generateRandomName();
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
            return handleExistingOrgByName({ name, tx, userId });
          }
        }

        // Enhanced error handling for other Clerk API errors
        if (error instanceof Error) {
          throw new Error(
            `Failed to create organization in Clerk for name: ${name}, slug: ${slug}, userId: ${userId}. Original error: ${error.message}`,
          );
        }
        throw new Error(
          `Failed to create organization in Clerk for name: ${name}, slug: ${slug}, userId: ${userId}`,
        );
      }
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
      return buildOrgResult({
        org: finalCheckOrg,
        tx,
        userId,
      });
    }

    // Upsert org in database (no Stripe customer ID initially)
    const org = await upsertOrgInDatabase({
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

    // Auto-subscribe to free plan only if org doesn't already have a subscription
    if (!org.stripeSubscriptionId) {
      await autoSubscribeToFreePlan({
        customerId: stripeCustomer.id,
        orgId: org.id,
        tx,
      });
    }

    return buildOrgResult({
      org: { ...org, stripeCustomerId: stripeCustomer.id },
      tx,
      userId,
    });
  });
}
