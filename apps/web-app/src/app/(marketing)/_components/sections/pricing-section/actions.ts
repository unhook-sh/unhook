'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Orgs } from '@unhook/db/schema';
import {
  BILLING_INTERVALS,
  createCheckoutSession,
  getOrCreateCustomer,
  PLAN_TYPES,
} from '@unhook/stripe';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

// Validation schemas
const createCheckoutSchema = z.object({
  billingInterval: z.enum(['monthly', 'yearly']).default('monthly'),
  orgId: z.string().min(1, 'Organization ID is required'),
  planType: z.enum(['free', 'team']).default('team'),
});

// Create checkout session action for pricing cards
export const createCheckoutSessionAction = action
  .inputSchema(createCheckoutSchema)
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Get the organization
    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.id, parsedInput.orgId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Get the origin URL
    const headersList = await headers();
    const origin = headersList.get('origin') || 'https://unhook.sh';

    // Create or get Stripe customer
    let customerId = org.stripeCustomerId;

    if (!customerId) {
      // Get user details from Clerk for creating customer
      const user = await auth();

      const customer = await getOrCreateCustomer({
        email: user.sessionClaims?.email as string,
        metadata: {
          orgId: org.id,
          userId: user.userId as string,
        },
        name: org.name,
      });

      if (!customer) {
        throw new Error('Failed to create Stripe customer');
      }

      customerId = customer.id;

      // Update org with customer ID
      await db
        .update(Orgs)
        .set({
          stripeCustomerId: customerId,
        })
        .where(eq(Orgs.id, parsedInput.orgId));
    }

    // Create checkout session
    const session = await createCheckoutSession({
      billingInterval:
        parsedInput.billingInterval === 'yearly'
          ? BILLING_INTERVALS.YEARLY
          : BILLING_INTERVALS.MONTHLY,
      cancelUrl: `${origin}/pricing?canceled=true`,
      customerId,
      orgId: parsedInput.orgId,
      planType:
        parsedInput.planType === 'free' ? PLAN_TYPES.FREE : PLAN_TYPES.TEAM,
      successUrl: `${origin}/app/settings/billing?success=true`,
    });

    // Redirect to Stripe Checkout
    if (!session.url) {
      throw new Error('Failed to create checkout session');
    }
    redirect(session.url);
  });
