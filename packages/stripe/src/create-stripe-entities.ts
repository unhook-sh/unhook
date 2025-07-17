import Stripe from 'stripe';
import { env } from './env.server';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
});

// Constants
const CONSTANTS = {
  CENTS_MULTIPLIER: 100,
  DEFAULT_CURRENCY: 'usd' as const,
  YEARLY_DISCOUNT_RATE: 0.8, // 20% discount for yearly plans
} as const;

// Types
interface BillingInterval {
  type: 'month' | 'year';
  label: 'monthly' | 'yearly';
}

interface Entitlement {
  name: string;
  lookupKey: string;
  id?: string;
}

interface PlanConfig {
  id: string;
  name: string;
  description: string;
  baseFeeCents: number;
  includedWebhookEvents: number; // Daily webhook events
  pricingModel: 'flat' | 'per_user';
  baseUsers?: number; // Number of users included in base price
  pricePerUserCents?: number; // Cost per additional user
  features: string[];
  lookup_keys: {
    monthly: string;
    monthly_metered: string;
    yearly: string;
    yearly_metered: string;
  };
  entitlements?: Entitlement[];
}

// Plan configurations based on Unhook's pricing
const PLANS: PlanConfig[] = [
  {
    baseFeeCents: 0,
    description:
      'Perfect for individual developers getting started with webhook testing',
    entitlements: [
      {
        lookupKey: 'webhook_events_10_per_day',
        name: '10 Webhook Events Per Day',
      },
      {
        lookupKey: 'single_webhook_url',
        name: 'Single Webhook URL',
      },
      {
        lookupKey: 'basic_monitoring',
        name: 'Basic Webhook Monitoring',
      },
    ],
    features: [
      '50 webhook events per day',
      'One webhook URL',
      'Basic webhook monitoring',
      'Local event routing',
      'Single developer',
      'Public webhook URLs',
      'Community support',
    ],
    id: 'free',
    includedWebhookEvents: 50,
    lookup_keys: {
      monthly: 'unhook_free_2025_01_monthly',
      monthly_metered: 'unhook_free_2025_01_monthly_metered',
      yearly: 'unhook_free_2025_01_yearly',
      yearly_metered: 'unhook_free_2025_01_yearly_metered',
    },
    name: 'Free Plan',
    pricingModel: 'flat',
  },
  {
    baseFeeCents: 20 * CONSTANTS.CENTS_MULTIPLIER,
    baseUsers: 1,
    description: 'Ideal for development teams with unlimited webhook events',
    entitlements: [
      {
        lookupKey: 'unlimited_webhook_events',
        name: 'Unlimited Webhook Events',
      },
      {
        lookupKey: 'unlimited_webhook_urls',
        name: 'Unlimited Webhook URLs',
      },
      {
        lookupKey: 'mcp_server_access',
        name: 'MCP Server Access',
      },
      {
        lookupKey: 'team_webhook_sharing',
        name: 'Team Webhook Sharing',
      },
      {
        lookupKey: 'private_webhook_urls',
        name: 'Private Webhook URLs',
      },
      {
        lookupKey: 'priority_support',
        name: 'Priority Support',
      },
    ],
    features: [
      'Unlimited webhook events',
      'Unlimited webhook URLs',
      'MCP Server',
      'Team webhook sharing',
      'Private webhook URLs',
      'Priority support',
      'Per-user pricing',
    ],
    id: 'team', // -1 indicates unlimited
    includedWebhookEvents: -1,
    lookup_keys: {
      monthly: 'unhook_team_2025_01_monthly',
      monthly_metered: 'unhook_team_2025_01_monthly_metered',
      yearly: 'unhook_team_2025_01_yearly',
      yearly_metered: 'unhook_team_2025_01_yearly_metered',
    }, // First user included in base price
    name: 'Team Plan', // $5 per additional user
    pricePerUserCents: 10 * CONSTANTS.CENTS_MULTIPLIER,
    pricingModel: 'per_user',
  },
];

// Addon configurations
interface AddonConfig {
  id: string;
  name: string;
  description: string;
  baseFeeCents: number;
  features: string[];
  lookup_keys: {
    monthly: string;
    yearly: string;
  };
  entitlements?: Entitlement[];
}

const ADDONS: AddonConfig[] = [
  {
    baseFeeCents: 500 * CONSTANTS.CENTS_MULTIPLIER,
    description: 'Get dedicated support through a private Slack channel',
    entitlements: [
      {
        lookupKey: 'dedicated_slack_support',
        name: 'Dedicated Slack Support',
      },
    ],
    features: [
      'Dedicated Slack channel',
      'Direct access to support team',
      'Priority issue resolution',
      '4-hour response time SLA',
    ],
    id: 'dedicated_support',
    lookup_keys: {
      monthly: 'unhook_dedicated_support_2025_01_monthly',
      yearly: 'unhook_dedicated_support_2025_01_yearly',
    },
    name: 'Dedicated Support',
  },
];

// Meter configurations
const WEBHOOK_METER_CONFIG = {
  description: 'Tracks the number of webhook events processed',
  eventName: 'webhook_events_2025_01',
  formula: 'last',
  name: 'Webhook Events Meter',
} as const;

const USER_METER_CONFIG = {
  description: 'Tracks the number of team members',
  eventName: 'team_members_2025_01',
  formula: 'last',
  name: 'Team Members Meter',
} as const;

// Utility functions
function calculateYearlyAmount(monthlyAmount: number): number {
  return Math.floor(monthlyAmount * 12 * CONSTANTS.YEARLY_DISCOUNT_RATE);
}

async function findOrCreateMeter(
  meterConfig: typeof WEBHOOK_METER_CONFIG | typeof USER_METER_CONFIG,
): Promise<Stripe.Billing.Meter> {
  const existingMeters = await stripe.billing.meters.list();
  const existingMeter = existingMeters.data.find(
    (m) => m.event_name === meterConfig.eventName,
  );

  if (existingMeter) {
    console.log('Found existing meter:', existingMeter.id);
    return existingMeter;
  }

  const meter = await stripe.billing.meters.create({
    customer_mapping: {
      event_payload_key: 'stripe_customer_id',
      type: 'by_id',
    },
    default_aggregation: {
      formula: meterConfig.formula,
    },
    display_name: meterConfig.name,
    event_name: meterConfig.eventName,
    value_settings: {
      event_payload_key: 'value',
    },
  });

  console.log('Created new meter:', meter.id);
  return meter;
}

async function findOrCreateUsageProduct(): Promise<Stripe.Product> {
  const existingProducts = await stripe.products.list({
    active: true,
  });

  const existingProduct = existingProducts.data.find(
    (p) => p.name === 'Unhook Usage',
  );

  if (existingProduct) {
    // Update unit_label if not set or incorrect
    if (existingProduct.unit_label !== 'webhook events') {
      await stripe.products.update(existingProduct.id, {
        unit_label: 'webhook events',
      });
    }
    console.log('Found existing usage product:', existingProduct.id);
    return existingProduct;
  }

  const product = await stripe.products.create({
    description: 'Usage-based pricing for webhook events across all plans',
    metadata: {
      type: 'metered',
    },
    name: 'Unhook Usage',
    unit_label: 'webhook events',
  });

  console.log('Created new usage product:', product.id);
  return product;
}

async function findOrCreateUserProduct(): Promise<Stripe.Product> {
  const existingProducts = await stripe.products.list({
    active: true,
  });

  const existingProduct = existingProducts.data.find(
    (p) => p.name === 'Unhook Team Members',
  );

  if (existingProduct) {
    // Update unit_label if not set or incorrect
    if (existingProduct.unit_label !== 'team members') {
      await stripe.products.update(existingProduct.id, {
        unit_label: 'team members',
      });
    }
    console.log('Found existing user product:', existingProduct.id);
    return existingProduct;
  }

  const product = await stripe.products.create({
    description: 'Per-user pricing for team plans',
    metadata: {
      type: 'metered',
    },
    name: 'Unhook Team Members',
    unit_label: 'team members',
  });

  console.log('Created new user product:', product.id);
  return product;
}

async function createOrUpdatePrice(params: {
  product: string;
  amount: number;
  interval: BillingInterval['type'];
  isMetered?: boolean;
  includedWebhookEvents?: number;
  includedUsers?: number;
  pricePerUserCents?: number;
  lookupKey: string;
  metadata: Record<string, string | number>;
  meterId?: string;
}): Promise<Stripe.Price> {
  const {
    product,
    amount,
    interval,
    isMetered,
    includedWebhookEvents,
    includedUsers,
    pricePerUserCents,
    lookupKey,
    metadata,
    meterId,
  } = params;

  // Try to find existing price
  const existingPrices = await stripe.prices.list({
    active: true,
    lookup_keys: [lookupKey],
  });

  if (existingPrices.data.length > 0 && existingPrices.data[0]) {
    return existingPrices.data[0];
  }

  const basePrice = {
    currency: CONSTANTS.DEFAULT_CURRENCY,
    lookup_key: lookupKey,
    metadata,
    nickname: isMetered
      ? `${metadata.type === 'addon' ? 'Add-on' : 'Base'} price (${interval}ly) with ${includedWebhookEvents === -1 ? 'unlimited' : includedWebhookEvents?.toLocaleString()} included webhook events${includedUsers ? ` and ${includedUsers} included users` : ''}`
      : `${metadata.type === 'addon' ? 'Add-on' : 'Base'} price (${interval}ly) with fixed pricing`,
    product,
    recurring: {
      interval,
      ...(isMetered && {
        usage_type: 'metered',
        ...(meterId && { meter: meterId }),
      }),
    },
  } satisfies Stripe.PriceCreateParams;

  if (isMetered) {
    // For user-based metering (Team plan)
    if (includedUsers !== undefined && pricePerUserCents !== undefined) {
      return stripe.prices.create({
        ...basePrice,
        billing_scheme: 'tiered',
        tiers: [
          {
            flat_amount: amount, // Base price for first N users
            unit_amount: 0,
            up_to: includedUsers,
          },
          {
            unit_amount: pricePerUserCents, // Per-user price for additional users
            up_to: 'inf',
          },
        ],
        tiers_mode: 'graduated',
      });
    }

    // For webhook event metering (Free plan)
    if (includedWebhookEvents !== undefined) {
      // For unlimited plans, just charge the base amount
      if (includedWebhookEvents === -1) {
        return stripe.prices.create({
          ...basePrice,
          unit_amount: amount,
        });
      }

      // For limited plans, use tiered pricing
      return stripe.prices.create({
        ...basePrice,
        billing_scheme: 'tiered',
        tiers: [
          {
            flat_amount: amount,
            unit_amount: 0,
            up_to: includedWebhookEvents,
          },
          {
            unit_amount: 100, // $1.00 per additional webhook event
            up_to: 'inf',
          },
        ],
        tiers_mode: 'graduated',
      });
    }
  }

  return stripe.prices.create({
    ...basePrice,
    unit_amount: amount,
  });
}

async function findOrCreateFeatureEntitlements(
  entitlements: Entitlement[],
): Promise<Entitlement[]> {
  if (!entitlements.length) {
    return [];
  }

  const createdEntitlements = await Promise.all(
    entitlements.map(async (entitlement) => {
      const existingFeatures = await stripe.entitlements.features.list({
        lookup_key: entitlement.lookupKey,
      });

      if (existingFeatures.data.length > 0 && existingFeatures.data[0]) {
        console.log(
          `Found existing entitlement feature: ${entitlement.name}`,
          existingFeatures.data[0].id,
        );
        return { ...entitlement, id: existingFeatures.data[0].id };
      }

      const newFeature = await stripe.entitlements.features.create({
        lookup_key: entitlement.lookupKey,
        name: entitlement.name,
      });
      console.log(
        `Created new entitlement feature: ${entitlement.name}`,
        newFeature.id,
      );
      return { ...entitlement, id: newFeature.id };
    }),
  );

  return createdEntitlements;
}

async function attachFeatureToProduct({
  productId,
  entitlementId,
}: {
  productId: string;
  entitlementId: string;
}): Promise<Stripe.Response<Stripe.ProductFeature>> {
  return stripe.products.createFeature(productId, {
    entitlement_feature: entitlementId,
  });
}

async function findOrCreateProduct(
  plan: PlanConfig,
  entitlements: Entitlement[],
): Promise<Stripe.Product> {
  const existingProducts = await stripe.products.list({
    active: true,
  });

  const existingProduct = existingProducts.data.find(
    (p) => p.name === `Unhook ${plan.name}`,
  );

  if (existingProduct) {
    const updatedProduct = await stripe.products.update(existingProduct.id, {
      description: plan.description,
      marketing_features: plan.features.map((feature) => ({
        name: feature,
      })),
    });

    // Attach entitlements to existing product
    await Promise.all(
      entitlements.map((entitlement) =>
        entitlement.id
          ? attachFeatureToProduct({
              entitlementId: entitlement.id,
              productId: updatedProduct.id,
            })
          : Promise.resolve(),
      ),
    );

    console.log(`Updated existing product: ${plan.name}`, updatedProduct.id);
    return updatedProduct;
  }

  const product = await stripe.products.create({
    description: plan.description,
    marketing_features: plan.features.map((feature) => ({
      name: feature,
    })),
    name: `Unhook ${plan.name}`,
  });

  // Attach entitlements to new product
  await Promise.all(
    entitlements.map((entitlement) =>
      entitlement.id
        ? attachFeatureToProduct({
            entitlementId: entitlement.id,
            productId: product.id,
          })
        : Promise.resolve(),
    ),
  );

  console.log(`Created new product: ${plan.name}`, product.id);
  return product;
}

async function findOrCreateAddonProduct(
  addon: AddonConfig,
  entitlements: Entitlement[],
): Promise<Stripe.Product> {
  const existingProducts = await stripe.products.list({
    active: true,
  });

  const existingProduct = existingProducts.data.find(
    (p) => p.name === `Unhook ${addon.name}`,
  );

  if (existingProduct) {
    const updatedProduct = await stripe.products.update(existingProduct.id, {
      description: addon.description,
      metadata: {
        features: JSON.stringify(addon.features),
      },
    });

    // Attach entitlements to existing product
    await Promise.all(
      entitlements.map((entitlement) =>
        entitlement.id
          ? attachFeatureToProduct({
              entitlementId: entitlement.id,
              productId: updatedProduct.id,
            })
          : Promise.resolve(),
      ),
    );

    console.log(`Updated existing addon: ${addon.name}`, updatedProduct.id);
    return updatedProduct;
  }

  const product = await stripe.products.create({
    description: addon.description,
    metadata: {
      features: JSON.stringify(addon.features),
    },
    name: `Unhook ${addon.name}`,
  });

  // Attach entitlements to new product
  await Promise.all(
    entitlements.map((entitlement) =>
      entitlement.id
        ? attachFeatureToProduct({
            entitlementId: entitlement.id,
            productId: product.id,
          })
        : Promise.resolve(),
    ),
  );

  console.log(`Created new addon: ${addon.name}`, product.id);
  return product;
}

async function main() {
  try {
    // 1. Create or find the shared billing meters
    const [webhookMeter, userMeter] = await Promise.all([
      findOrCreateMeter(WEBHOOK_METER_CONFIG),
      findOrCreateMeter(USER_METER_CONFIG),
    ]);

    // 2. Create or find the shared usage products
    const [usageProduct, userProduct] = await Promise.all([
      findOrCreateUsageProduct(),
      findOrCreateUserProduct(),
    ]);

    // 3. Process each plan
    for (const plan of PLANS) {
      // 3.a Create or find plan-specific entitlements
      const entitlements = await findOrCreateFeatureEntitlements(
        plan.entitlements ?? [],
      );

      // 3.b Create or update the base product with entitlements
      const baseProduct = await findOrCreateProduct(plan, entitlements);

      // 3.c Create monthly and yearly base prices
      const [monthlyBasePrice, yearlyBasePrice] = await Promise.all([
        createOrUpdatePrice({
          amount: plan.baseFeeCents,
          interval: 'month',
          lookupKey: plan.lookup_keys.monthly,
          metadata: {
            billing_period: 'monthly',
            plan_id: plan.id,
            type: 'base',
          },
          product: baseProduct.id,
        }),
        createOrUpdatePrice({
          amount: calculateYearlyAmount(plan.baseFeeCents),
          interval: 'year',
          lookupKey: plan.lookup_keys.yearly,
          metadata: {
            billing_period: 'yearly',
            plan_id: plan.id,
            type: 'base',
          },
          product: baseProduct.id,
        }),
      ]);

      // 3.d Create monthly and yearly metered prices based on plan type
      if (plan.pricingModel === 'per_user') {
        // Per-user pricing for Team plan
        const [monthlyUserPrice, yearlyUserPrice] = await Promise.all([
          createOrUpdatePrice({
            amount: plan.baseFeeCents,
            includedUsers: plan.baseUsers,
            interval: 'month',
            isMetered: true,
            lookupKey: plan.lookup_keys.monthly_metered,
            metadata: {
              billing_period: 'monthly',
              included_users: plan.baseUsers?.toString() ?? '0',
              meter_id: userMeter.id,
              meter_name: USER_METER_CONFIG.eventName,
              plan_id: plan.id,
              price_per_user_cents: plan.pricePerUserCents?.toString() ?? '0',
              type: 'metered',
            },
            meterId: userMeter.id,
            pricePerUserCents: plan.pricePerUserCents,
            product: userProduct.id,
          }),
          createOrUpdatePrice({
            amount: calculateYearlyAmount(plan.baseFeeCents),
            includedUsers: plan.baseUsers,
            interval: 'year',
            isMetered: true,
            lookupKey: plan.lookup_keys.yearly_metered,
            metadata: {
              billing_period: 'yearly',
              included_users: plan.baseUsers?.toString() ?? '0',
              meter_id: userMeter.id,
              meter_name: USER_METER_CONFIG.eventName,
              plan_id: plan.id,
              price_per_user_cents:
                Math.floor(
                  (plan.pricePerUserCents ?? 0) *
                    CONSTANTS.YEARLY_DISCOUNT_RATE,
                ).toString() ?? '0',
              type: 'metered',
            },
            meterId: userMeter.id,
            pricePerUserCents: Math.floor(
              (plan.pricePerUserCents ?? 0) * CONSTANTS.YEARLY_DISCOUNT_RATE,
            ),
            product: userProduct.id,
          }),
        ]);

        console.log(`Plan ${plan.id} provisioned (per-user):`, {
          baseProduct: baseProduct.id,
          monthlyBasePrice: monthlyBasePrice.id,
          monthlyUserPrice: monthlyUserPrice.id,
          userMeter: userMeter.id,
          yearlyBasePrice: yearlyBasePrice.id,
          yearlyUserPrice: yearlyUserPrice.id,
        });
      } else {
        // Webhook event pricing for Free plan
        const [monthlyUsagePrice, yearlyUsagePrice] = await Promise.all([
          createOrUpdatePrice({
            amount: plan.baseFeeCents,
            includedWebhookEvents: plan.includedWebhookEvents,
            interval: 'month',
            isMetered: true,
            lookupKey: plan.lookup_keys.monthly_metered,
            metadata: {
              billing_period: 'monthly',
              included_webhook_events: plan.includedWebhookEvents.toString(),
              meter_id: webhookMeter.id,
              meter_name: WEBHOOK_METER_CONFIG.eventName,
              plan_id: plan.id,
              type: 'metered',
            },
            meterId: webhookMeter.id,
            product: usageProduct.id,
          }),
          createOrUpdatePrice({
            amount: calculateYearlyAmount(plan.baseFeeCents),
            includedWebhookEvents:
              plan.includedWebhookEvents === -1
                ? -1
                : plan.includedWebhookEvents * 12,
            interval: 'year',
            isMetered: true,
            lookupKey: plan.lookup_keys.yearly_metered,
            metadata: {
              billing_period: 'yearly',
              included_webhook_events:
                plan.includedWebhookEvents === -1
                  ? 'unlimited'
                  : (plan.includedWebhookEvents * 12).toString(),
              meter_id: webhookMeter.id,
              meter_name: WEBHOOK_METER_CONFIG.eventName,
              plan_id: plan.id,
              type: 'metered',
            },
            meterId: webhookMeter.id,
            product: usageProduct.id,
          }),
        ]);

        console.log(`Plan ${plan.id} provisioned (webhook events):`, {
          baseProduct: baseProduct.id,
          monthlyBasePrice: monthlyBasePrice.id,
          monthlyUsagePrice: monthlyUsagePrice.id,
          webhookMeter: webhookMeter.id,
          yearlyBasePrice: yearlyBasePrice.id,
          yearlyUsagePrice: yearlyUsagePrice.id,
        });
      }
    }

    console.log('Usage product ID:', usageProduct.id);
    console.log('User product ID:', userProduct.id);

    // 4. Process each addon
    for (const addon of ADDONS) {
      // 4.a Create or find addon-specific entitlements
      const entitlements = await findOrCreateFeatureEntitlements(
        addon.entitlements ?? [],
      );

      // 4.b Create or update the product with entitlements
      const product = await findOrCreateAddonProduct(addon, entitlements);

      // 4.c Create monthly and yearly prices for the addon
      const [monthlyPrice, yearlyPrice] = await Promise.all([
        createOrUpdatePrice({
          amount: addon.baseFeeCents,
          interval: 'month',
          lookupKey: addon.lookup_keys.monthly,
          metadata: {
            addon_id: addon.id,
            billing_period: 'monthly',
            type: 'addon',
          },
          product: product.id,
        }),
        createOrUpdatePrice({
          amount: calculateYearlyAmount(addon.baseFeeCents),
          interval: 'year',
          lookupKey: addon.lookup_keys.yearly,
          metadata: {
            addon_id: addon.id,
            billing_period: 'yearly',
            type: 'addon',
          },
          product: product.id,
        }),
      ]);

      console.log(`Addon ${addon.id} provisioned:`, {
        monthlyPrice: monthlyPrice.id,
        product: product.id,
        yearlyPrice: yearlyPrice.id,
      });
    }

    console.log(
      'Successfully created or updated all Unhook products, prices, and addons!',
    );
  } catch (error) {
    console.error('Error creating or updating products and prices:', error);
    throw error;
  }
}

// Execute the creation
main().catch(console.error);
