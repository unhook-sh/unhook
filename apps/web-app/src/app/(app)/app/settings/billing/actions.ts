'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Orgs } from '@unhook/db/schema';
import {
  BILLING_INTERVALS,
  createBillingPortalSession,
  createCheckoutSession,
  getOrCreateCustomer,
  PLAN_TYPES,
  stripe,
} from '@unhook/stripe';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSafeActionClient } from 'next-safe-action';

// Create the action client
const action = createSafeActionClient();

// Create checkout session action
export const createCheckoutSessionAction = action.action(async () => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  // Get the organization
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.id, orgId),
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
      .where(eq(Orgs.id, orgId));
  }

  // Create checkout session
  const session = await createCheckoutSession({
    billingInterval: BILLING_INTERVALS.MONTHLY,
    cancelUrl: `${origin}/app/settings/billing?canceled=true`,
    customerId,
    orgId,
    planType: PLAN_TYPES.TEAM,
    successUrl: `${origin}/app/settings/billing?success=true`,
  });

  // Redirect to Stripe Checkout
  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }
  redirect(session.url);
});

// Create billing portal session action
export const createBillingPortalSessionAction = action.action(async () => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  // Get the organization
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.id, orgId),
  });

  if (!org || !org.stripeCustomerId) {
    throw new Error('No active subscription found');
  }

  // Get the origin URL
  const headersList = await headers();
  const origin = headersList.get('origin') || 'https://unhook.sh';

  // Create billing portal session
  const session = await createBillingPortalSession({
    customerId: org.stripeCustomerId,
    returnUrl: `${origin}/${org.clerkOrgId}/billing`,
  });

  // Redirect to Stripe Billing Portal
  redirect(session.url);
});

// Get invoices action
export const getInvoicesAction = action.action(async () => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  // Get the organization
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.id, orgId),
  });

  if (!org || !org.stripeCustomerId) {
    throw new Error('No active subscription found');
  }

  // Get invoices from Stripe
  const invoices = await stripe.invoices.list({
    customer: org.stripeCustomerId,
    limit: 20, // Limit to recent invoices
  });

  return invoices.data.map((invoice) => ({
    amount: invoice.total || 0,
    created: invoice.created,
    currency: invoice.currency,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    id: invoice.id,
    invoicePdf: invoice.invoice_pdf,
    status: invoice.status,
  }));
});
