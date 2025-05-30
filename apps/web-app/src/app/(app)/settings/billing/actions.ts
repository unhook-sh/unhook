'use server';

import { getApi } from '@unhook/api/server';
import { createSafeActionClient } from 'next-safe-action';
import Stripe from 'stripe';
import { z } from 'zod';
import { env } from '~/env';
import type { StripePortalResponse } from './types';

// Initialize Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Create the action client
const action = createSafeActionClient();

// Server actions
export const getStripePortalLink = action
  .schema(
    z.object({
      orgId: z.string(),
      returnUrl: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    try {
      const { orgId, returnUrl } = parsedInput;
      const api = await getApi();
      const organization = await api.getOrganization.fetch({
        org_id: orgId,
      });

      if (!organization) {
        return { success: false, error: 'Organization not found' };
      }

      if (!organization.org.stripe_customer_id) {
        return { success: false, error: 'No Stripe customer found' };
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: organization.org.stripe_customer_id,
        return_url: returnUrl,
      });

      return {
        success: true,
        data: { url: session.url } as StripePortalResponse,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create portal session',
        error,
      };
    }
  });

async function getPriceByLookupKey(props: { lookupKey: string }): Promise<
  | {
      success: true;
      data: Stripe.Price;
      error?: never;
    }
  | {
      success: false;
      error: string | Error | unknown;
      data?: never;
    }
> {
  try {
    const { lookupKey } = props;

    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });

    if (!prices.data.length) {
      return {
        success: false,
        error: `No active price found with lookup key: ${lookupKey}`,
      };
    }

    if (!prices.data[0]) {
      return {
        success: false,
        error: `No active price found with lookup key: ${lookupKey}`,
      };
    }

    return {
      success: true,
      data: prices.data[0],
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}

export const getStripeCheckoutLink = action
  .schema(
    z.object({
      orgId: z.string(),
      successUrl: z.string(),
      cancelUrl: z.string(),
      priceLookupKey: z.string(),
      meteredPriceLookupKey: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    try {
      const {
        orgId,
        successUrl,
        cancelUrl,
        priceLookupKey,
        meteredPriceLookupKey,
      } = parsedInput;
      const api = await getApi();
      const organization = await api.getOrganization.fetch({
        org_id: orgId,
      });

      if (!organization) {
        return { success: false, error: 'Organization not found' };
      }

      if (!organization.org.stripe_customer_id) {
        return { success: false, error: 'No Stripe customer found' };
      }

      const flatPrice = await getPriceByLookupKey({
        lookupKey: priceLookupKey,
      });

      const eventsPrice = await getPriceByLookupKey({
        lookupKey: meteredPriceLookupKey,
      });

      if (!flatPrice.success || !eventsPrice.success) {
        return {
          success: false,
          error: 'Failed to retrieve prices',
        };
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        automatic_tax: { enabled: true },
        billing_address_collection: 'auto',
        cancel_url: cancelUrl,
        client_reference_id: organization.org.stripe_customer_id,
        consent_collection: {
          payment_method_reuse_agreement: {
            position: 'auto',
          },
          terms_of_service: 'required',
        },
        currency: 'USD',
        customer: organization.org.stripe_customer_id,
        customer_update: {
          address: 'auto',
        },
        line_items: [
          {
            price: flatPrice.data.id,
            quantity: 1,
            adjustable_quantity: {
              enabled: false,
            },
          },
          {
            price: eventsPrice.data.id,
            quantity: 1,
          },
        ],
        metadata: {
          orgId,
        },
        mode: 'subscription',
        success_url: successUrl,
      });

      return {
        success: true,
        data: { url: checkoutSession.url },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create checkout session',
        error,
      };
    }
  });
export const getStripeInvoices = action
  .schema(
    z.object({
      orgId: z.string(),
      limit: z.number().default(10),
      startingAfter: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    try {
      const { orgId, limit } = parsedInput;

      const api = await getApi();
      const organization = await api.getOrganization.fetch({
        org_id: orgId,
      });

      if (!organization) {
        return { success: false, error: 'Organization not found' };
      }

      if (!organization.org.stripe_customer_id) {
        return { success: false, error: 'No Stripe customer found' };
      }

      const invoices = await stripe.invoices
        .list({
          customer: organization.org.stripe_customer_id,
        })
        .autoPagingToArray({ limit });

      return {
        success: true,
        data: invoices.filter(
          (invoice) => invoice.status !== 'draft' && invoice.status !== 'void',
        ),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch invoices',
        error,
      };
    }
  });
