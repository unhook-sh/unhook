import { auth } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Orgs } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { stripe } from '../index';
import type {
  EntitlementKey,
  EntitlementsRecord,
  PartialEntitlementsRecord,
} from './entitlement-types';

// Helper function to get customer entitlements from Stripe
async function getCustomerEntitlements(
  customerId: string,
): Promise<EntitlementsRecord> {
  try {
    // Get the customer's active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      expand: ['data.items.data.price'],
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      return {} as EntitlementsRecord;
    }

    // Create a map of entitlement features
    const entitlementMap: Partial<EntitlementsRecord> = {};

    // Check each subscription for product features
    for (const subscription of subscriptions.data) {
      for (const item of subscription.items.data) {
        if (item.price.product) {
          const productId =
            typeof item.price.product === 'string'
              ? item.price.product
              : item.price.product.id;

          // Fetch product features separately
          try {
            const productFeatures =
              await stripe.products.listFeatures(productId);

            for (const feature of productFeatures.data) {
              if (feature.entitlement_feature?.lookup_key) {
                const lookupKey = feature.entitlement_feature
                  .lookup_key as EntitlementKey;
                entitlementMap[lookupKey] = true;
              }
            }
          } catch (featureError) {
            console.error('Error fetching product features:', featureError);
          }
        }
      }
    }

    return entitlementMap as EntitlementsRecord;
  } catch (error) {
    console.error('Error fetching customer entitlements:', error);
    return {} as EntitlementsRecord;
  }
}

/**
 * Helper function to check if the current user's organization has specific entitlements
 * This is the most common pattern for server actions
 * Can check a single entitlement (returns boolean) or multiple entitlements (returns Record<string, boolean>)
 */
export async function checkOrgEntitlements(
  entitlement: EntitlementKey | EntitlementKey[],
): Promise<boolean | PartialEntitlementsRecord> {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return Array.isArray(entitlement) ? {} : false;
  }

  // Get the organization
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.id, orgId),
  });

  if (!org?.stripeCustomerId) {
    return Array.isArray(entitlement) ? {} : false;
  }

  const entitlements = await getCustomerEntitlements(org.stripeCustomerId);

  // If checking a single entitlement, return boolean
  if (typeof entitlement === 'string') {
    return entitlements[entitlement] || false;
  }

  // If checking multiple entitlements, return Record<string, boolean>
  const result: PartialEntitlementsRecord = {};
  for (const ent of entitlement) {
    result[ent] = entitlements[ent] || false;
  }

  return result;
}

/**
 * Helper function to get all entitlements for the current user's organization
 */
export async function getOrgEntitlements(): Promise<EntitlementsRecord> {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {} as EntitlementsRecord;
  }

  // Get the organization
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.id, orgId),
  });

  if (!org?.stripeCustomerId) {
    return {} as EntitlementsRecord;
  }

  return getCustomerEntitlements(org.stripeCustomerId);
}

/**
 * Helper function to require a specific entitlement and throw an error if not available
 * Useful for server actions that should fail if the entitlement is missing
 */
export async function isEntitled(
  entitlement: EntitlementKey,
  errorMessage?: string,
): Promise<void> {
  const hasEntitlement = await checkOrgEntitlements(entitlement);

  if (!hasEntitlement) {
    throw new Error(
      errorMessage ||
        `This feature requires the "${entitlement}" entitlement. Please upgrade your plan.`,
    );
  }
}

/**
 * Helper function to require at least one of multiple entitlements
 */
export async function isEntitledToAny(
  entitlements: EntitlementKey[],
  errorMessage?: string,
): Promise<EntitlementKey> {
  const orgEntitlements = await getOrgEntitlements();

  for (const entitlement of entitlements) {
    if (orgEntitlements[entitlement]) {
      return entitlement;
    }
  }

  throw new Error(
    errorMessage ||
      `This feature requires one of the following entitlements: ${entitlements.join(', ')}. Please upgrade your plan.`,
  );
}

/**
 * Helper function to require all of multiple entitlements
 */
export async function isEntitledToAll(
  entitlements: EntitlementKey[],
  errorMessage?: string,
): Promise<void> {
  const orgEntitlements = await getOrgEntitlements();

  const missingEntitlements = entitlements.filter(
    (entitlement) => !orgEntitlements[entitlement],
  );

  if (missingEntitlements.length > 0) {
    throw new Error(
      errorMessage ||
        `This feature requires all of the following entitlements: ${missingEntitlements.join(', ')}. Please upgrade your plan.`,
    );
  }
}

/**
 * Helper function to check multiple entitlements and return a map
 */
export async function checkMultipleEntitlements(
  entitlements: EntitlementKey[],
): Promise<PartialEntitlementsRecord> {
  const orgEntitlements = await getOrgEntitlements();

  const result: PartialEntitlementsRecord = {};
  for (const entitlement of entitlements) {
    result[entitlement] = orgEntitlements[entitlement] || false;
  }

  return result;
}
