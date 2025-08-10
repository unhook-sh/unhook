#!/usr/bin/env bun

import Stripe from 'stripe';
import { env } from '../src/env.server';

// Initialize Stripe with the secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
});

async function deleteCustomerSubscriptions(customerId: string): Promise<void> {
  try {
    console.log(`🔍 Finding subscriptions for customer: ${customerId}`);

    // List all subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100, // Adjust if you expect more than 100 subscriptions
    });

    if (subscriptions.data.length === 0) {
      console.log('✅ No subscriptions found for this customer');
      return;
    }

    console.log(`📋 Found ${subscriptions.data.length} subscription(s):`);

    // Delete subscriptions in batches to respect Stripe's rate limits
    console.log(
      `🚀 Starting batched deletion of ${subscriptions.data.length} subscriptions...`,
    );

    const BATCH_SIZE = 10; // Process 10 at a time to avoid rate limits
    const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

    let successCount = 0;
    let failureCount = 0;

    // Process subscriptions in batches
    for (let i = 0; i < subscriptions.data.length; i += BATCH_SIZE) {
      const batch = subscriptions.data.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(subscriptions.data.length / BATCH_SIZE);

      console.log(
        `📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} subscriptions)...`,
      );

      // Process current batch in parallel
      const batchPromises = batch.map(async (subscription) => {
        try {
          await stripe.subscriptions.cancel(subscription.id);
          return {
            id: subscription.id,
            status: subscription.status,
            success: true,
          };
        } catch (error) {
          return {
            error,
            id: subscription.id,
            status: subscription.status,
            success: false,
          };
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.allSettled(batchPromises);

      // Process batch results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { success, id, status, error } = result.value;
          if (success) {
            console.log(
              `✅ Successfully deleted subscription: ${id} (${status})`,
            );
            successCount++;
          } else {
            console.error(`❌ Failed to delete subscription ${id}:`, error);
            failureCount++;
          }
        } else {
          console.error('❌ Failed to delete subscription:', result.reason);
          failureCount++;
        }
      });

      // Add delay between batches (except for the last batch)
      if (i + BATCH_SIZE < subscriptions.data.length) {
        console.log(
          `⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES),
        );
      }
    }

    console.log(
      `📊 Deletion Summary: ${successCount} successful, ${failureCount} failed`,
    );

    console.log('🎉 Finished processing all subscriptions');
  } catch (error) {
    console.error('❌ Error deleting customer subscriptions:', error);
    process.exit(1);
  }
}

// Main execution
async function main(): Promise<void> {
  const customerId = process.argv[2];

  if (!customerId) {
    console.error('❌ Please provide a customer ID as an argument');
    console.error(
      'Usage: bun run delete-customer-subscriptions.ts <customer_id>',
    );
    console.error(
      'Example: bun run delete-customer-subscriptions.ts cus_1234567890',
    );
    process.exit(1);
  }

  // Validate customer ID format (basic check)
  if (!customerId.startsWith('cus_')) {
    console.error(
      '❌ Invalid customer ID format. Customer IDs should start with "cus_"',
    );
    process.exit(1);
  }

  console.log('🚀 Starting subscription deletion process...');
  await deleteCustomerSubscriptions(customerId);
}

// Run the script
if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
