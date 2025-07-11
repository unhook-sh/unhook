import Stripe from 'stripe';
import { env } from './env.server';

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
}: {
  orgId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const meterEvent = await stripe.prices.list({
    active: true,
    limit: 1,
    lookup_keys: [env.STRIPE_PRICE_METER_LOOKUP_KEY],
  });

  const subscriptionPrice = await stripe.prices.list({
    active: true,
    limit: 1,
    lookup_keys: [env.STRIPE_PRICE_SUBSCRIPTION_LOOKUP_KEY],
  });

  if (meterEvent.data.length === 0) {
    throw new Error('Meter event not found');
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
      },
      {
        price: meterEvent.data[0]?.id,
      },
    ],
    metadata: {
      orgId,
    },
    mode: 'subscription',
    subscription_data: {
      metadata: {
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
  // First, try to find existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  return stripe.customers.create({
    email,
    metadata,
    name,
  });
}
