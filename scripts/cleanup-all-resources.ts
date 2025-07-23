#!/usr/bin/env bun

import { clerkClient } from '@clerk/nextjs/server';
import { createEnv } from '@t3-oss/env-core';
import { db } from '@unhook/db/client';
import { OrgMembers, Orgs, Users } from '@unhook/db/schema';
import { stripe } from '@unhook/stripe';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Environment validation
const _env = createEnv({
  runtimeEnv: process.env,
  server: {
    CLERK_SECRET_KEY: z.string(),
    POSTGRES_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string(),
  },
  skipValidation: !!process.env.CI,
});

interface OrgWithResources {
  id: string;
  name: string;
  clerkOrgId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  createdAt: Date | null;
}

interface CleanupStats {
  totalOrgs: number;
  deletedFromClerk: number;
  deletedFromStripe: number;
  deletedFromDatabase: number;
  errors: Array<{ orgId: string; error: string }>;
}

class AllResourcesCleanupService {
  private clerk: ReturnType<typeof clerkClient>;
  private isDryRun: boolean;
  private stats: CleanupStats;

  constructor(isDryRun = false) {
    this.clerk = clerkClient();
    this.isDryRun = isDryRun;
    this.stats = {
      deletedFromClerk: 0,
      deletedFromDatabase: 0,
      deletedFromStripe: 0,
      errors: [],
      totalOrgs: 0,
    };
  }

  async getAllOrgs(): Promise<OrgWithResources[]> {
    console.log('🔍 Fetching all organizations from database...');

    const orgs = await db
      .select({
        clerkOrgId: Orgs.clerkOrgId,
        createdAt: Orgs.createdAt,
        id: Orgs.id,
        name: Orgs.name,
        stripeCustomerId: Orgs.stripeCustomerId,
        stripeSubscriptionId: Orgs.stripeSubscriptionId,
        stripeSubscriptionStatus: Orgs.stripeSubscriptionStatus,
      })
      .from(Orgs);

    this.stats.totalOrgs = orgs.length;
    console.log(`📊 Found ${orgs.length} organizations`);

    return orgs;
  }

  async deleteStripeSubscription(subscriptionId: string): Promise<boolean> {
    if (this.isDryRun) {
      console.log(
        `      💳 Would delete Stripe subscription: ${subscriptionId}`,
      );
      return true;
    }

    try {
      await stripe.subscriptions.cancel(subscriptionId);
      console.log(`✅ Deleted Stripe subscription: ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to delete Stripe subscription ${subscriptionId}:`,
        error,
      );
      return false;
    }
  }

  async deleteStripeCustomer(customerId: string): Promise<boolean> {
    if (this.isDryRun) {
      console.log(`      💳 Would delete Stripe customer: ${customerId}`);
      return true;
    }

    try {
      await stripe.customers.del(customerId);
      console.log(`✅ Deleted Stripe customer: ${customerId}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to delete Stripe customer ${customerId}:`,
        error,
      );
      return false;
    }
  }

  async deleteOrgFromClerk(clerkOrgId: string): Promise<boolean> {
    if (this.isDryRun) {
      console.log(`      👥 Would delete Clerk organization: ${clerkOrgId}`);
      return true;
    }

    try {
      const clerk = await this.clerk;
      await clerk.organizations.deleteOrganization(clerkOrgId);
      console.log(`✅ Deleted Clerk organization: ${clerkOrgId}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to delete Clerk organization ${clerkOrgId}:`,
        error,
      );
      return false;
    }
  }

  async deleteOrgFromDatabase(orgId: string): Promise<boolean> {
    if (this.isDryRun) {
      console.log(`      🗄️  Would delete organization from database: ${orgId}`);
      return true;
    }

    try {
      // Delete org members first (due to foreign key constraints)
      await db.delete(OrgMembers).where(eq(OrgMembers.orgId, orgId));

      // Delete the org
      await db.delete(Orgs).where(eq(Orgs.id, orgId));

      console.log(`✅ Deleted organization from database: ${orgId}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to delete organization from database ${orgId}:`,
        error,
      );
      return false;
    }
  }

  async cleanupOrgResources(org: OrgWithResources): Promise<void> {
    console.log(
      `\n🧹 Cleaning up resources for organization: ${org.name} (${org.id})`,
    );

    let hasErrors = false;

    // 1. Delete Stripe subscription if exists
    if (org.stripeSubscriptionId) {
      console.log(
        `   📋 Found Stripe subscription: ${org.stripeSubscriptionId}`,
      );
      const deleted = await this.deleteStripeSubscription(
        org.stripeSubscriptionId,
      );
      if (deleted) {
        this.stats.deletedFromStripe++;
      } else {
        hasErrors = true;
      }
    } else {
      console.log('   📋 No Stripe subscription found');
    }

    // 2. Delete Stripe customer if exists
    if (org.stripeCustomerId) {
      console.log(`   💳 Found Stripe customer: ${org.stripeCustomerId}`);
      const deleted = await this.deleteStripeCustomer(org.stripeCustomerId);
      if (deleted) {
        this.stats.deletedFromStripe++;
      } else {
        hasErrors = true;
      }
    } else {
      console.log('   💳 No Stripe customer found');
    }

    // 3. Delete from Clerk
    console.log(`   👥 Deleting from Clerk: ${org.clerkOrgId}`);
    const clerkDeleted = await this.deleteOrgFromClerk(org.clerkOrgId);
    if (clerkDeleted) {
      this.stats.deletedFromClerk++;
    } else {
      hasErrors = true;
    }

    // 4. Delete from database
    console.log(`   🗄️  Deleting from database: ${org.id}`);
    const dbDeleted = await this.deleteOrgFromDatabase(org.id);
    if (dbDeleted) {
      this.stats.deletedFromDatabase++;
    } else {
      hasErrors = true;
    }

    if (hasErrors) {
      this.stats.errors.push({
        error: 'Some cleanup operations failed',
        orgId: org.id,
      });
    }
  }

  async validateCleanup(): Promise<void> {
    console.log('\n🔍 Validating cleanup...');

    const remainingOrgs = await db.select().from(Orgs);
    const remainingUsers = await db.select().from(Users);

    console.log(`📊 Remaining organizations: ${remainingOrgs.length}`);
    console.log(`📊 Remaining users: ${remainingUsers.length}`);

    if (remainingOrgs.length === 0) {
      console.log('✅ All organizations have been cleaned up');
    } else {
      console.log('⚠️  Some organizations still remain in the database');
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting complete resource cleanup...\n');

    if (this.isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    try {
      // Get all organizations
      const orgs = await this.getAllOrgs();

      if (orgs.length === 0) {
        console.log('✅ No organizations found to clean up');
        return;
      }

      console.log(`Found ${orgs.length} organizations to clean up:\n`);

      // Process each organization
      for (const org of orgs) {
        await this.cleanupOrgResources(org);
      }

      // Validate the cleanup
      await this.validateCleanup();

      // Print summary
      this.printSummary();

      console.log('\n🎉 Complete resource cleanup finished!');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      process.exit(1);
    }
  }

  private printSummary(): void {
    console.log('\n📊 Cleanup Summary:');
    console.log('==================');
    console.log(`Total organizations processed: ${this.stats.totalOrgs}`);
    console.log(`Deleted from Clerk: ${this.stats.deletedFromClerk}`);
    console.log(`Deleted from Stripe: ${this.stats.deletedFromStripe}`);
    console.log(`Deleted from database: ${this.stats.deletedFromDatabase}`);

    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors encountered: ${this.stats.errors.length}`);
      for (const error of this.stats.errors) {
        console.log(`   - ${error.orgId}: ${error.error}`);
      }
    } else {
      console.log('\n✅ No errors encountered');
    }
  }
}

// Main execution
async function main() {
  console.log('🧹 Unhook Complete Resource Cleanup Script');
  console.log('==========================================\n');

  // Check if running in dry-run mode
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Add confirmation prompt for non-dry-run mode
  if (!isDryRun) {
    console.log(
      '⚠️  WARNING: This will permanently delete ALL organizations and their resources!',
    );
    console.log('   This includes:');
    console.log('   - All Stripe customers and subscriptions');
    console.log('   - All Clerk organizations');
    console.log('   - All organiionzat data from the database');
    console.log('');

    const readline = await import('node:readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(
        'Are you absolutely sure you want to proceed? Type "DELETE ALL" to confirm: ',
        resolve,
      );
    });

    rl.close();

    if (answer !== 'DELETE ALL') {
      console.log('❌ Cleanup cancelled');
      process.exit(0);
    }

    console.log('\n🚀 Proceeding with complete cleanup...\n');
  }

  const cleanupService = new AllResourcesCleanupService(isDryRun);
  await cleanupService.run();
}

// Run the script
if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
