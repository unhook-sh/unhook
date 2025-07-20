import Stripe from 'stripe';
import { env } from './env.server';
import {
  BILLING_INTERVALS,
  type BillingInterval,
  PLAN_TYPES,
  type PlanType,
  PRICE_IDS,
  PRICE_LOOKUP_KEYS,
  PRODUCT_IDS,
  type PriceId,
  type PriceLookupKey,
  type ProductId,
} from './guards/billing-types.generated';

// Initialize Stripe with the secret key
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
});

/**
 * Record usage for a customer using Stripe Meter Events
 *
 * Before using this function, you must:
 * 1. Create a meter in your Stripe Dashboard
 * 2. Set the meter's event_name in STRIPE_METER_EVENT_NAME environment variable
 * 3. Associate the meter with a usage-based price
 *
 * @see https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api
 */
export async function recordUsage({
  customerId,
  quantity,
  timestamp = Math.floor(Date.now() / 1000),
  idempotencyKey,
}: {
  customerId: string;
  quantity: number;
  timestamp?: number;
  idempotencyKey?: string;
}) {
  // Create a meter event to record usage
  const meterEvent = await stripe.billing.meterEvents.create({
    event_name: env.STRIPE_METER_EVENT_NAME,
    identifier: idempotencyKey,
    payload: {
      stripe_customer_id: customerId,
      value: quantity.toString(), // Meter events expect value as string
    }, // Use Unix timestamp directly
    timestamp: timestamp ? Math.floor(timestamp) : undefined,
  });

  return meterEvent;
}

// Create a checkout session for a new subscription
export async function createCheckoutSession({
  orgId,
  customerId,
  successUrl,
  cancelUrl,
  planType = PLAN_TYPES.TEAM, // Default to Team plan
  billingInterval = BILLING_INTERVALS.MONTHLY, // Default to monthly
}: {
  orgId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  planType: PlanType;
  billingInterval: BillingInterval;
}) {
  // Get the appropriate price lookup key based on plan and billing interval
  const getPriceLookupKey = (): PriceLookupKey => {
    if (planType === PLAN_TYPES.FREE) {
      // Free plan only has monthly pricing
      return PRICE_LOOKUP_KEYS.FREE_MONTHLY;
    }
    return billingInterval === BILLING_INTERVALS.MONTHLY
      ? PRICE_LOOKUP_KEYS.TEAM_MONTHLY
      : PRICE_LOOKUP_KEYS.TEAM_YEARLY;
  };

  const priceLookupKey = getPriceLookupKey();

  const subscriptionPrice = await stripe.prices.list({
    active: true,
    limit: 1,
    lookup_keys: [priceLookupKey],
  });

  if (subscriptionPrice.data.length === 0) {
    throw new Error(`Price not found for lookup key: ${priceLookupKey}`);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    cancel_url: cancelUrl,
    customer: customerId,
    customer_creation: customerId ? undefined : 'always',
    line_items: [
      {
        price: subscriptionPrice.data[0]?.id,
        quantity: 1,
      },
    ],
    metadata: {
      billingInterval,
      orgId,
      planType,
    },
    mode: 'subscription',
    subscription_data: {
      metadata: {
        billingInterval,
        orgId,
        planType,
      },
    },
    success_url: successUrl,
  };

  return stripe.checkout.sessions.create(sessionParams);
}

// Create a checkout session for an addon
export async function createAddonCheckoutSession({
  orgId,
  customerId,
  successUrl,
  cancelUrl,
  addonType = 'dedicated_support',
  billingInterval = BILLING_INTERVALS.MONTHLY,
}: {
  orgId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  addonType?: 'dedicated_support';
  billingInterval?: BillingInterval;
}) {
  const getAddonPriceLookupKey = (): PriceLookupKey => {
    if (addonType === 'dedicated_support') {
      return billingInterval === BILLING_INTERVALS.MONTHLY
        ? PRICE_LOOKUP_KEYS.DEDICATED_SUPPORT_MONTHLY
        : PRICE_LOOKUP_KEYS.DEDICATED_SUPPORT_YEARLY;
    }
    throw new Error(`Unknown addon type: ${addonType}`);
  };

  const priceLookupKey = getAddonPriceLookupKey();

  const addonPrice = await stripe.prices.list({
    active: true,
    limit: 1,
    lookup_keys: [priceLookupKey],
  });

  if (addonPrice.data.length === 0) {
    throw new Error(`Addon price not found for lookup key: ${priceLookupKey}`);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    cancel_url: cancelUrl,
    customer: customerId,
    customer_creation: customerId ? undefined : 'always',
    line_items: [
      {
        price: addonPrice.data[0]?.id,
      },
    ],
    metadata: {
      addonType,
      billingInterval,
      orgId,
    },
    mode: 'subscription',
    subscription_data: {
      metadata: {
        addonType,
        billingInterval,
        orgId,
      },
    },
    success_url: successUrl,
  };

  return stripe.checkout.sessions.create(sessionParams);
}

// Create a billing portal session for managing subscriptions
export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Verify webhook signature
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );
}

// Get or create a Stripe customer
export async function getOrCreateCustomer({
  email,
  name,
  metadata,
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  // Use Stripe's customer search to find existing customers by email
  const existingCustomers = await stripe.customers.search({
    limit: 100,
    query: `email:'${email}'`, // Get more results to check metadata
  });

  // Look for a customer with matching metadata (e.g., same org context)
  // This allows multiple customers with same email but different orgs
  if (existingCustomers.data.length > 0 && metadata?.orgId) {
    const matchingCustomer = existingCustomers.data.find(
      (customer) => customer.metadata?.orgId === metadata.orgId,
    );
    if (matchingCustomer) {
      // Update the existing customer with any new metadata
      return stripe.customers.update(matchingCustomer.id, {
        metadata: { ...matchingCustomer.metadata, ...metadata },
        name,
      });
    }
  }

  // Create new customer
  return stripe.customers.create({
    email,
    metadata,
    name,
  });
}

// Alternative: More explicit upsert by org ID
export async function upsertCustomerByOrg({
  email,
  name,
  orgId,
  additionalMetadata = {},
}: {
  email: string;
  name?: string;
  orgId: string;
  additionalMetadata?: Record<string, string>;
}) {
  const metadata = {
    orgId,
    ...additionalMetadata,
  };

  // Search for existing customer with this org ID
  const existingCustomers = await stripe.customers.search({
    limit: 1,
    query: `metadata['orgId']:'${orgId}'`,
  });

  if (existingCustomers.data.length > 0) {
    const existingCustomer = existingCustomers.data[0];
    if (!existingCustomer) {
      throw new Error('Failed to retrieve existing customer');
    }
    // Update existing customer
    return stripe.customers.update(existingCustomer.id, {
      email,
      metadata: { ...existingCustomer.metadata, ...metadata },
      name,
    });
  }

  // Create new customer
  return stripe.customers.create({
    email,
    metadata,
    name,
  });
}

// Alternative: Use Stripe's idempotency keys for true upsert behavior
export async function upsertCustomerWithIdempotency({
  email,
  name,
  metadata,
  idempotencyKey,
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  idempotencyKey: string;
}) {
  return stripe.customers.create(
    {
      email,
      metadata,
      name,
    },
    {
      idempotencyKey,
    },
  );
}

// Helper function to get price by lookup key
export async function getPriceByLookupKey(
  lookupKey: PriceLookupKey,
): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.list({
    active: true,
    limit: 1,
    lookup_keys: [lookupKey],
  });

  return prices.data[0] || null;
}

// Helper function to get product by ID
export async function getProductById(
  productId: ProductId,
): Promise<Stripe.Product | null> {
  try {
    return await stripe.products.retrieve(productId);
  } catch (_error) {
    return null;
  }
}

// Create a subscription directly (for auto-subscribing to free plan)
export async function createSubscription({
  customerId,
  priceId,
  orgId,
  planType = PLAN_TYPES.FREE,
  billingInterval = BILLING_INTERVALS.MONTHLY,
}: {
  customerId: string;
  priceId: string;
  orgId: string;
  planType?: PlanType;
  billingInterval?: BillingInterval;
}) {
  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    expand: ['latest_invoice.payment_intent'],
    items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      billingInterval,
      orgId,
      planType,
    },
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
  };

  return stripe.subscriptions.create(subscriptionParams);
}

// Get the free plan price ID
export async function getFreePlanPriceId(): Promise<string> {
  const freePrice = await stripe.prices.list({
    active: true,
    limit: 1,
    lookup_keys: [PRICE_LOOKUP_KEYS.FREE_MONTHLY],
  });

  if (freePrice.data.length === 0) {
    throw new Error('Free plan price not found');
  }

  return freePrice.data[0]?.id || '';
}

// Export the type-safe constants for use in other modules
export {
  BILLING_INTERVALS,
  PLAN_TYPES,
  PRICE_IDS,
  PRICE_LOOKUP_KEYS,
  PRODUCT_IDS,
  type BillingInterval,
  type PlanType,
  type PriceId,
  type PriceLookupKey,
  type ProductId,
};
