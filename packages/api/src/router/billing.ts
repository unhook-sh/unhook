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
import type Stripe from 'stripe';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const billingRouter = createTRPCRouter({
  // Cancel subscription at period end
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const org = await ctx.db.query.Orgs.findFirst({
      where: eq(Orgs.id, ctx.auth.orgId),
    });

    if (!org || !org.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    try {
      const subscription = (await stripe.subscriptions.update(
        org.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        },
      )) as Stripe.Subscription;

      // Update local database
      await ctx.db
        .update(Orgs)
        .set({
          stripeSubscriptionStatus: subscription.status,
        })
        .where(eq(Orgs.id, ctx.auth.orgId));

      return {
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        success: true,
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }),

  // Create a billing portal session for managing existing subscription
  createBillingPortalSession: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const org = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.id, ctx.auth.orgId),
      });

      if (!org || !org.stripeCustomerId) {
        throw new Error('No active subscription found');
      }

      const session = await createBillingPortalSession({
        customerId: org.stripeCustomerId,
        returnUrl: input.returnUrl,
      });

      if (!session.url) {
        throw new Error('Failed to create billing portal session');
      }

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  // Create a checkout session for new subscription
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        billingInterval: z.enum(['monthly', 'yearly']).default('monthly'),
        cancelUrl: z.string().url(),
        planType: z.enum(['free', 'team']).default('team'),
        successUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const org = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.id, ctx.auth.orgId),
      });

      if (!org) {
        throw new Error('Organization not found');
      }

      // Create or get Stripe customer
      let customerId = org.stripeCustomerId;

      if (!customerId) {
        // Get user details from Clerk for creating customer
        const customer = await getOrCreateCustomer({
          email: ctx.auth.sessionClaims?.email as string,
          metadata: {
            orgId: org.id,
            userId: ctx.auth.userId as string,
          },
          name: org.name,
        });

        if (!customer) {
          throw new Error('Failed to create Stripe customer');
        }

        customerId = customer.id;

        // Update org with customer ID
        await ctx.db
          .update(Orgs)
          .set({
            stripeCustomerId: customerId,
          })
          .where(eq(Orgs.id, ctx.auth.orgId));
      }

      // Create checkout session
      const session = await createCheckoutSession({
        billingInterval:
          input.billingInterval === 'yearly'
            ? BILLING_INTERVALS.YEARLY
            : BILLING_INTERVALS.MONTHLY,
        cancelUrl: input.cancelUrl,
        customerId,
        orgId: ctx.auth.orgId,
        planType: input.planType === 'free' ? PLAN_TYPES.FREE : PLAN_TYPES.TEAM,
        successUrl: input.successUrl,
      });

      if (!session.url) {
        throw new Error('Failed to create checkout session');
      }

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  // Get organization billing details
  getBillingDetails: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const org = await ctx.db.query.Orgs.findFirst({
      where: eq(Orgs.id, ctx.auth.orgId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    return {
      customerId: org.stripeCustomerId,
      name: org.name,
      subscriptionId: org.stripeSubscriptionId,
      subscriptionStatus: org.stripeSubscriptionStatus,
    };
  }),

  // Get invoices for the current organization
  getInvoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        startingAfter: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const org = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.id, ctx.auth.orgId),
      });

      if (!org || !org.stripeCustomerId) {
        throw new Error('No active subscription found');
      }

      const invoices = await stripe.invoices.list({
        customer: org.stripeCustomerId,
        limit: input.limit,
        starting_after: input.startingAfter,
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
    }),

  // Get subscription details from Stripe
  getSubscriptionDetails: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const org = await ctx.db.query.Orgs.findFirst({
      where: eq(Orgs.id, ctx.auth.orgId),
    });

    if (!org || !org.stripeSubscriptionId) {
      return null;
    }

    try {
      const subscription = (await stripe.subscriptions.retrieve(
        org.stripeSubscriptionId,
        {
          expand: ['latest_invoice', 'customer'],
        },
      )) as Stripe.Subscription;

      return {
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at,
        id: subscription.id,
        items: subscription.items.data.map((item) => ({
          id: item.id,
          price: {
            currency: item.price.currency,
            id: item.price.id,
            recurring: item.price.recurring,
            unitAmount: item.price.unit_amount,
          },
          quantity: item.quantity,
        })),
        latestInvoice: subscription.latest_invoice
          ? {
              amount: (subscription.latest_invoice as Stripe.Invoice).total,
              hostedInvoiceUrl: (subscription.latest_invoice as Stripe.Invoice)
                .hosted_invoice_url,
              id: (subscription.latest_invoice as Stripe.Invoice).id,
              status: (subscription.latest_invoice as Stripe.Invoice).status,
            }
          : null,
        status: subscription.status,
        trialEnd: subscription.trial_end,
        trialStart: subscription.trial_start,
      };
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return null;
    }
  }),
  // Get subscription status for the current organization
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const org = await ctx.db.query.Orgs.findFirst({
      where: eq(Orgs.id, ctx.auth.orgId),
    });

    if (!org) {
      return {
        customerId: null,
        hasAny: false,
        isActive: false,
        isCanceled: false,
        isPaid: false,
        isPastDue: false,
        isTrialing: false,
        status: null,
        subscriptionId: null,
      };
    }

    const status = org.stripeSubscriptionStatus;
    const isPaid = ['active', 'past_due', 'trialing'].includes(status || '');

    return {
      customerId: org.stripeCustomerId,
      hasAny: !!status,
      isActive: status === 'active',
      isCanceled: status === 'canceled',
      isPaid,
      isPastDue: status === 'past_due',
      isTrialing: status === 'trialing',
      status,
      subscriptionId: org.stripeSubscriptionId,
    };
  }),

  // Get usage-based billing information
  getUsageInfo: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const org = await ctx.db.query.Orgs.findFirst({
      where: eq(Orgs.id, ctx.auth.orgId),
    });

    if (!org || !org.stripeSubscriptionId) {
      return null;
    }

    try {
      const subscription = (await stripe.subscriptions.retrieve(
        org.stripeSubscriptionId,
      )) as Stripe.Subscription;

      // Get usage records for metered items
      const usageRecords = await Promise.all(
        subscription.items.data
          .filter((item) => item.price.recurring?.usage_type === 'metered')
          .map(async (item) => {
            // Note: This would require the correct Stripe API method
            // For now, return basic item info
            return {
              itemId: item.id,
              period: {
                end: Date.now() / 1000 + 30 * 24 * 60 * 60, // Current timestamp as fallback
                start: Date.now() / 1000, // 30 days from now
              },
              priceId: item.price.id, // Would need to implement usage tracking
              totalUsage: 0,
            };
          }),
      );

      return {
        subscriptionId: subscription.id,
        usageRecords,
      };
    } catch (error) {
      console.error('Error retrieving usage info:', error);
      return null;
    }
  }),

  // Reactivate subscription (remove cancel at period end)
  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const org = await ctx.db.query.Orgs.findFirst({
      where: eq(Orgs.id, ctx.auth.orgId),
    });

    if (!org || !org.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    try {
      const subscription = (await stripe.subscriptions.update(
        org.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        },
      )) as Stripe.Subscription;

      // Update local database
      await ctx.db
        .update(Orgs)
        .set({
          stripeSubscriptionStatus: subscription.status,
        })
        .where(eq(Orgs.id, ctx.auth.orgId));

      return {
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        success: true,
      };
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw new Error('Failed to reactivate subscription');
    }
  }),
});
