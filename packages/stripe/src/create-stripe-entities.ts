import Stripe from 'stripe';
import { env } from './env.server';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
});

// Constants
const CONSTANTS = {
  CENTS_MULTIPLIER: 100,
  DEFAULT_CURRENCY: 'usd' as const,
  YEARLY_DISCOUNT_RATE: 0.8, // 20% discount for yearly plans (24/30 = 0.8)
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
    monthly_metered?: string;
    yearly?: string;
    yearly_metered?: string;
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
        lookupKey: 'webhook_events_50_per_day',
        name: '50 Webhook Events Per Day',
      },
      {
        lookupKey: 'single_webhook_url',
        name: 'Single Webhook URL',
      },
      {
        lookupKey: 'basic_monitoring',
        name: 'Basic Webhook Monitoring',
      },
      {
        lookupKey: 'cli_editor_access',
        name: 'CLI & Editor Extension Access',
      },
      {
        lookupKey: 'local_event_routing',
        name: 'Local Event Routing',
      },
      {
        lookupKey: 'public_webhook_urls',
        name: 'Public Webhook URLs',
      },
      {
        lookupKey: 'community_support',
        name: 'Community Support',
      },
    ],
    features: [
      'CLI & Editor extension access',
      '50 webhook events per day',
      '1 webhook URL',
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
    },
    name: 'Free Plan',
    pricingModel: 'flat',
  },
  {
    baseFeeCents: 30 * CONSTANTS.CENTS_MULTIPLIER,
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
        lookupKey: 'ai_powered_debugging',
        name: 'AI-Powered Debugging with MCP Server',
      },
      {
        lookupKey: 'trace_ai_agent_workflows',
        name: 'Trace AI Agent Workflows',
      },
      {
        lookupKey: 'team_webhook_sharing',
        name: 'Team Webhook Sharing',
      },
      {
        lookupKey: 'unlimited_developers',
        name: 'Unlimited Developers',
      },
      {
        lookupKey: 'private_webhook_urls',
        name: 'Private Webhook URLs',
      },
      {
        lookupKey: 'custom_webhook_transformations',
        name: 'Custom Webhook Transformations',
      },
      {
        lookupKey: 'custom_webhook_subdomains',
        name: 'Custom Webhook Subdomains',
      },
      {
        lookupKey: 'advanced_monitoring_analytics',
        name: 'Advanced Monitoring & Analytics',
      },
      {
        lookupKey: 'route_to_external_integrations',
        name: 'Route to External Integrations',
      },
    ],
    features: [
      'AI-Powered debugging with MCP Server',
      'Trace AI Agent Workflows',
      'Unlimited webhook events',
      'Unlimited webhook URLs',
      'Team webhook sharing',
      'Unlimited developers',
      'Private webhook URLs',
      'Custom webhook transformations',
      'Custom webhook subdomains',
      'Advanced monitoring & analytics',
      'Route to external integrations',
    ],
    id: 'team',
    includedWebhookEvents: -1,
    lookup_keys: {
      monthly: 'unhook_team_2025_01_monthly',
      yearly: 'unhook_team_2025_01_yearly',
    },
    name: 'Team Plan',
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

// Utility functions
function calculateYearlyAmount(monthlyAmount: number): number {
  // Apply 20% discount to annual pricing: monthly * 12 * 0.8
  // For Team plan: $30/month * 12 * 0.8 = $288/year
  return Math.floor(monthlyAmount * 12 * CONSTANTS.YEARLY_DISCOUNT_RATE);
}

function calculateYearlyPerUserAmount(monthlyPerUserAmount: number): number {
  // Apply 20% discount to annual per-user pricing: monthly * 12 * 0.8
  // For Team plan per-user: $10/month * 12 * 0.8 = $96/year per additional seat
  return Math.floor(monthlyPerUserAmount * 12 * CONSTANTS.YEARLY_DISCOUNT_RATE);
}

// Helper function to add delay between API calls
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function to retry API calls
async function _retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }

      // If it's a 500 error, wait longer before retrying
      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error &&
        error.statusCode === 500
      ) {
        console.log(
          `API call failed with 500 error, retrying in ${delayMs * 2}ms... (attempt ${i + 1}/${maxRetries})`,
        );
        await delay(delayMs * 2);
      } else {
        console.log(
          `API call failed, retrying in ${delayMs}ms... (attempt ${i + 1}/${maxRetries})`,
        );
        await delay(delayMs);
      }
    }
  }
  throw new Error('Max retries exceeded');
}

async function createOrUpdatePrice(params: {
  product: string;
  amount: number;
  interval: BillingInterval['type'];
  includedUsers?: number;
  pricePerUserCents?: number;
  lookupKey: string;
  metadata: Record<string, string | number>;
}): Promise<Stripe.Price> {
  const {
    product,
    amount,
    interval,
    includedUsers,
    pricePerUserCents,
    lookupKey,
    metadata,
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
    nickname: `${metadata.type === 'addon' ? 'Add-on' : 'Base'} price (${interval}ly) with ${includedUsers ? `${includedUsers} included users` : 'fixed pricing'}`,
    product,
    recurring: {
      interval,
    },
  } satisfies Stripe.PriceCreateParams;

  // For per-seat billing (Team plan) or fixed pricing
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
}): Promise<Stripe.Response<Stripe.ProductFeature> | null> {
  try {
    // First, check if the feature is already attached to this product
    const existingFeatures = await stripe.products.listFeatures(productId);
    const isAlreadyAttached = existingFeatures.data.some(
      (feature) =>
        feature.entitlement_feature &&
        feature.entitlement_feature.id === entitlementId,
    );

    if (isAlreadyAttached) {
      console.log(
        `Feature ${entitlementId} is already attached to product ${productId}`,
      );
      return null;
    }

    // If not attached, attach it
    const result = await stripe.products.createFeature(productId, {
      entitlement_feature: entitlementId,
    });
    console.log(`Attached feature ${entitlementId} to product ${productId}`);
    return result;
  } catch (error) {
    // If the error is about the feature already being attached, ignore it
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('more than once')
    ) {
      console.log(
        `Feature ${entitlementId} is already attached to product ${productId} (ignoring error)`,
      );
      return null;
    }
    throw error;
  }
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
    console.log('Starting Stripe entities creation...');

    // 3. Process each plan
    for (const plan of PLANS) {
      console.log(`Processing plan: ${plan.id}`);

      // 3.a Create or find plan-specific entitlements
      console.log(`Creating/finding entitlements for plan: ${plan.id}`);
      const entitlements = await findOrCreateFeatureEntitlements(
        plan.entitlements ?? [],
      );

      // 3.b Create or update the base product with entitlements
      console.log(`Creating/updating product for plan: ${plan.id}`);
      const baseProduct = await findOrCreateProduct(plan, entitlements);

      // 3.c Create prices based on pricing model
      if (plan.pricingModel === 'per_user') {
        console.log(`Creating per-seat prices for plan: ${plan.id}`);
        // Per-seat pricing for Team plan using Stripe's native per-seat billing
        const monthlyPrice = await createOrUpdatePrice({
          amount: plan.baseFeeCents,
          includedUsers: plan.baseUsers,
          interval: 'month',
          lookupKey: plan.lookup_keys.monthly,
          metadata: {
            billing_period: 'monthly',
            included_users: plan.baseUsers?.toString() ?? '0',
            plan_id: plan.id,
            price_per_user_cents: plan.pricePerUserCents?.toString() ?? '0',
            type: 'per_seat',
          },
          pricePerUserCents: plan.pricePerUserCents,
          product: baseProduct.id,
        });

        if (plan.lookup_keys.yearly) {
          const yearlyPrice = await createOrUpdatePrice({
            amount: calculateYearlyAmount(plan.baseFeeCents),
            includedUsers: plan.baseUsers,
            interval: 'year',
            lookupKey: plan.lookup_keys.yearly,
            metadata: {
              billing_period: 'yearly',
              included_users: plan.baseUsers?.toString() ?? '0',
              plan_id: plan.id,
              price_per_user_cents:
                calculateYearlyPerUserAmount(
                  plan.pricePerUserCents ?? 0,
                ).toString() ?? '0',
              type: 'per_seat',
            },
            pricePerUserCents: calculateYearlyPerUserAmount(
              plan.pricePerUserCents ?? 0,
            ),
            product: baseProduct.id,
          });

          console.log(`Plan ${plan.id} provisioned (per-seat):`, {
            baseProduct: baseProduct.id,
            monthlyPrice: monthlyPrice.id,
            yearlyPrice: yearlyPrice.id,
          });
        } else {
          console.log(`Plan ${plan.id} provisioned (per-seat):`, {
            baseProduct: baseProduct.id,
            monthlyPrice: monthlyPrice.id,
          });
        }
      } else {
        console.log(`Creating free price for plan: ${plan.id}`);
        // Create a free price for the free plan to enable subscription management
        const freePrice = await createOrUpdatePrice({
          amount: 0,
          interval: 'month',
          lookupKey: plan.lookup_keys.monthly,
          metadata: {
            billing_period: 'monthly',
            plan_id: plan.id,
            type: 'free',
          },
          product: baseProduct.id,
        });

        console.log(`Plan ${plan.id} provisioned (free):`, {
          baseProduct: baseProduct.id,
          freePrice: freePrice.id,
        });
      }
    }

    // 4. Process each addon
    for (const addon of ADDONS) {
      console.log(`Processing addon: ${addon.id}`);

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

    // Add more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // If it's a Stripe error, log additional details
    if (error && typeof error === 'object' && 'raw' in error) {
      console.error(
        'Stripe error details:',
        JSON.stringify(error.raw, null, 2),
      );
    }

    throw error;
  }
}

// Execute the creation
main().catch(console.error);
