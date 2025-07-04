# Stripe Integration Guide

This guide explains how to set up and use the Stripe integration for billing webhook events.

## Overview

The Unhook platform uses Stripe for usage-based billing. Organizations are charged based on the number of webhook events they receive. Each webhook event is metered and billed at $0.001 per event.

## Setup

### 1. Create a Stripe Account

1. Sign up for a [Stripe account](https://stripe.com)
2. Navigate to the Dashboard

### 2. Create a Product and Price

1. Go to **Products** in the Stripe Dashboard
2. Click **Add product**
3. Name it "Webhook Events" or similar
4. For pricing:
   - Choose **Usage-based** pricing
   - Set the unit name to "event"
   - Choose **Metered usage**
   - Set the price per unit (e.g., $0.001)
   - Set aggregation to **Sum of usage values during period**
   - Choose your billing period (monthly recommended)
5. Save the product and note the Price ID (starts with `price_`)

### 3. Configure Webhooks

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Add your webhook endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select the following events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Save and note the webhook signing secret

### 4. Set Environment Variables

Add the following to your `.env` file:

```env
# Stripe Billing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_USAGE_RECORD_PRICE_ID=price_...
```

### 5. Apply Database Migrations

Run the database migrations to add Stripe fields to the organizations table:

```bash
cd packages/db
bun run push
```

## How It Works

### Subscription Flow

1. **Subscribe**: Users click "Subscribe Now" on the billing page
2. **Checkout**: They're redirected to Stripe Checkout to enter payment details
3. **Activation**: Upon successful payment, the webhook updates the org's subscription status
4. **Usage Tracking**: Each webhook event received increments the usage counter
5. **Billing**: Stripe automatically bills based on usage at the end of each period

### Usage Recording

When a webhook event is received:
1. The system checks if the organization has an active subscription
2. If active, it records a usage event to Stripe
3. The event ID is used as an idempotency key to prevent duplicate charges

### Subscription Management

Users can:
- View their subscription status on the billing page
- Access the Stripe billing portal to:
  - Update payment methods
  - View invoices
  - Cancel subscription
  - See usage details

## Database Schema

The following fields are added to the `orgs` table:
- `stripeCustomerId`: The Stripe customer ID
- `stripeSubscriptionId`: The active subscription ID
- `stripeSubscriptionStatus`: Current status (active, past_due, canceled)

## API Endpoints

### Webhook Handler
- **POST** `/api/webhooks/stripe` - Handles Stripe webhook events

### Billing Actions
- `createCheckoutSessionAction(orgId)` - Creates a Stripe Checkout session
- `createBillingPortalSessionAction(orgId)` - Creates a billing portal session

## Testing

### Test Mode
1. Use Stripe test keys (start with `pk_test_` and `sk_test_`)
2. Use test credit card: `4242 4242 4242 4242`
3. Test webhook events using Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Verify Integration
1. Create a test subscription
2. Send test webhook events
3. Check usage is recorded in Stripe Dashboard
4. Verify subscription status updates

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Ensure you're using the correct webhook secret
   - Check that the raw request body is used for verification

2. **Usage not recording**
   - Verify the organization has an active subscription
   - Check API logs for errors
   - Ensure the price ID is correctly configured

3. **Subscription status not updating**
   - Check webhook endpoint is receiving events
   - Verify database updates are working
   - Check for errors in webhook logs

## Support

For issues with:
- Stripe integration: Check [Stripe documentation](https://stripe.com/docs)
- Webhook setup: See our [webhook documentation](./webhooks.md)
- Billing questions: Contact support@unhook.sh