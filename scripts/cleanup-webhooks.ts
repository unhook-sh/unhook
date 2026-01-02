#!/usr/bin/env bun

import { clerkClient } from '@clerk/nextjs/server';
import { createEnv } from '@t3-oss/env-core';
import { db } from '@unhook/db/client';
import { Orgs, Users, Webhooks } from '@unhook/db/schema';
import { count, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';

// Environment validation
const _env = createEnv({
  runtimeEnv: process.env,
  server: {
    CLERK_SECRET_KEY: z.string(),
    POSTGRES_URL: z.string().url(),
  },
  skipValidation: !!process.env.CI,
});

interface OrgWebhookCount {
  orgId: string;
  orgName: string;
  orgCreatedByUserId: string;
  orgCreatedByEmail: string;
  webhookCount: number;
  webhookIds: string[];
}

interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string; id: string }>;
  primaryEmailAddressId: string | null;
}

interface ClerkOrg {
  id: string;
  name: string;
  createdBy?: string;
  createdAt: number;
}

class WebhookCleanupService {
  private clerk: ReturnType<typeof clerkClient>;

  constructor() {
    this.clerk = clerkClient();
  }

  async findOrgsWithMultipleWebhooks(): Promise<OrgWebhookCount[]> {
    console.log('🔍 Finding organizations with multiple webhooks...');

    const result = await db
      .select({
        orgId: Webhooks.orgId,
        webhookCount: count(Webhooks.id),
      })
      .from(Webhooks)
      .groupBy(Webhooks.orgId)
      .having(gt(count(Webhooks.id), 1));

    const orgWebhookCounts: OrgWebhookCount[] = [];

    for (const row of result) {
      // Get all webhooks for this org
      const orgWebhooks = await db
        .select({ id: Webhooks.id })
        .from(Webhooks)
        .where(eq(Webhooks.orgId, row.orgId));

      const webhookIds = orgWebhooks.map((webhook) => webhook.id);

      // Get org details
      const org = await db
        .select()
        .from(Orgs)
        .where(eq(Orgs.id, row.orgId))
        .limit(1);

      if (!org[0]) {
        console.warn(`⚠️  Organization ${row.orgId} not found, skipping`);
        continue;
      }

      // Get user email who created the org
      const user = await db
        .select({ email: Users.email })
        .from(Users)
        .where(eq(Users.id, org[0].createdByUserId))
        .limit(1);

      orgWebhookCounts.push({
        orgCreatedByEmail: user[0]?.email || 'unknown',
        orgCreatedByUserId: org[0].createdByUserId,
        orgId: row.orgId,
        orgName: org[0].name,
        webhookCount: Number(row.webhookCount),
        webhookIds,
      });
    }

    return orgWebhookCounts;
  }

  async findOrgsWithoutWebhooks(): Promise<OrgWebhookCount[]> {
    console.log('🔍 Finding organizations without webhooks...');

    // Find orgs that don't have any webhooks
    const orgsWithoutWebhooks = await db
      .select({
        createdByUserId: Orgs.createdByUserId,
        id: Orgs.id,
        name: Orgs.name,
      })
      .from(Orgs)
      .leftJoin(Webhooks, eq(Orgs.id, Webhooks.orgId))
      .where(isNull(Webhooks.id));

    const orgWebhookCounts: OrgWebhookCount[] = [];

    for (const org of orgsWithoutWebhooks) {
      // Get user email who created the org
      const user = await db
        .select({ email: Users.email })
        .from(Users)
        .where(eq(Users.id, org.createdByUserId))
        .limit(1);

      orgWebhookCounts.push({
        orgCreatedByEmail: user[0]?.email || 'unknown',
        orgCreatedByUserId: org.createdByUserId,
        orgId: org.id,
        orgName: org.name,
        webhookCount: 0,
        webhookIds: [],
      });
    }

    return orgWebhookCounts;
  }

  async getWebhookDetails(
    webhookIds: string[],
  ): Promise<Map<string, typeof Webhooks.$inferSelect>> {
    const webhookDetails = new Map<string, typeof Webhooks.$inferSelect>();

    for (const webhookId of webhookIds) {
      const webhook = await db
        .select()
        .from(Webhooks)
        .where(eq(Webhooks.id, webhookId))
        .limit(1);

      if (webhook[0]) {
        webhookDetails.set(webhookId, webhook[0]);
      }
    }

    return webhookDetails;
  }

  async getClerkUser(userId: string): Promise<ClerkUser | null> {
    try {
      const clerk = await this.clerk;
      return await clerk.users.getUser(userId);
    } catch (error: unknown) {
      console.warn(`⚠️  Could not fetch Clerk user ${userId}:`, error);
      return null;
    }
  }

  async getClerkOrg(orgId: string): Promise<ClerkOrg | null> {
    try {
      const clerk = await this.clerk;
      return await clerk.organizations.getOrganization({
        organizationId: orgId,
      });
    } catch (error: unknown) {
      // Check if it's a 404 (not found) error, which is expected for orgs that don't exist in Clerk
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 404
      ) {
        console.log(
          `      📞 Organization ${orgId} not found in Clerk (expected)`,
        );
        return null;
      }
      console.warn(`⚠️  Could not fetch Clerk org ${orgId}:`, error);
      return null;
    }
  }

  async deleteOrgFromClerk(orgId: string): Promise<boolean> {
    try {
      const clerk = await this.clerk;
      await clerk.organizations.deleteOrganization(orgId);
      console.log(`✅ Deleted org ${orgId} from Clerk`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete org ${orgId} from Clerk:`, error);
      return false;
    }
  }

  async deleteOrgFromDatabase(orgId: string): Promise<boolean> {
    try {
      // Delete the org (cascade will handle related records)
      await db.delete(Orgs).where(eq(Orgs.id, orgId));
      console.log(`✅ Deleted org ${orgId} from database`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete org ${orgId} from database:`, error);
      return false;
    }
  }

  async deleteWebhookFromDatabase(webhookId: string): Promise<boolean> {
    try {
      // Delete the webhook (cascade will handle related records)
      await db.delete(Webhooks).where(eq(Webhooks.id, webhookId));
      console.log(`✅ Deleted webhook ${webhookId} from database`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to delete webhook ${webhookId} from database:`,
        error,
      );
      return false;
    }
  }

  async cleanupOrgsWithoutWebhooks(
    orgsWithoutWebhooks: OrgWebhookCount[],
  ): Promise<void> {
    if (orgsWithoutWebhooks.length === 0) {
      console.log('✅ No organizations found without webhooks');
      return;
    }

    console.log(
      `\n🗑️  Found ${orgsWithoutWebhooks.length} organizations without webhooks:`,
    );

    for (const org of orgsWithoutWebhooks) {
      console.log(
        `\n🧹 Cleaning up org without webhooks: ${org.orgName} (${org.orgId})`,
      );
      console.log(
        `   Created by: ${org.orgCreatedByEmail} (${org.orgCreatedByUserId})`,
      );

      // Check if org exists in Clerk
      const clerkOrg = await this.getClerkOrg(org.orgId);

      if (clerkOrg) {
        console.log('   📞 Found in Clerk, deleting...');
        await this.deleteOrgFromClerk(org.orgId);
      } else {
        console.log('   📞 Not found in Clerk, skipping Clerk deletion');
      }

      // Delete from database
      await this.deleteOrgFromDatabase(org.orgId);
    }
  }

  async cleanupOrgsWithMultipleWebhooks(
    orgsWithMultipleWebhooks: OrgWebhookCount[],
  ): Promise<void> {
    if (orgsWithMultipleWebhooks.length === 0) {
      console.log('✅ No organizations found with multiple webhooks');
      return;
    }

    console.log(
      `\n🔧 Found ${orgsWithMultipleWebhooks.length} organizations with multiple webhooks:`,
    );

    for (const org of orgsWithMultipleWebhooks) {
      console.log(
        `\n🧹 Cleaning up org with multiple webhooks: ${org.orgName} (${org.orgId})`,
      );
      console.log(
        `   Created by: ${org.orgCreatedByEmail} (${org.orgCreatedByUserId})`,
      );
      console.log(`   Found ${org.webhookCount} webhooks`);

      const webhookDetails = await this.getWebhookDetails(org.webhookIds);

      // Sort webhooks by creation date (keep the oldest one)
      const sortedWebhooks = org.webhookIds
        .map((webhookId) => ({
          details: webhookDetails.get(webhookId),
          webhookId,
        }))
        .filter(
          (
            webhook,
          ): webhook is {
            details: typeof Webhooks.$inferSelect;
            webhookId: string;
          } => webhook.details !== undefined,
        )
        .sort((a, b) => {
          const aDate =
            a.details.createdAt instanceof Date
              ? a.details.createdAt
              : new Date(a.details.createdAt || Date.now());
          const bDate =
            b.details.createdAt instanceof Date
              ? b.details.createdAt
              : new Date(b.details.createdAt || Date.now());
          return aDate.getTime() - bDate.getTime();
        });

      if (sortedWebhooks.length === 0) {
        console.log('   ⚠️  No valid webhooks found for org');
        continue;
      }

      // Keep the oldest webhook (first in sorted array)
      const webhookToKeep = sortedWebhooks[0]!;
      const webhooksToDelete = sortedWebhooks.slice(1);

      console.log(
        `   📋 Keeping webhook: ${webhookToKeep.webhookId} (${webhookToKeep.details.name}) - created ${webhookToKeep.details.createdAt}`,
      );
      console.log(
        `   🗑️  Deleting ${webhooksToDelete.length} duplicate webhook(s):`,
      );

      for (const webhook of webhooksToDelete) {
        console.log(
          `      - ${webhook.webhookId} (${webhook.details.name}) - created ${webhook.details.createdAt}`,
        );

        // Delete webhook from database (cascade will handle related records)
        await this.deleteWebhookFromDatabase(webhook.webhookId);
      }
    }
  }

  async validateCleanup(): Promise<void> {
    console.log('\n🔍 Validating cleanup...');

    const orgsWithMultipleWebhooks = await this.findOrgsWithMultipleWebhooks();
    const orgsWithoutWebhooks = await this.findOrgsWithoutWebhooks();

    if (
      orgsWithMultipleWebhooks.length === 0 &&
      orgsWithoutWebhooks.length === 0
    ) {
      console.log('✅ All organizations now have exactly one webhook');
    } else {
      if (orgsWithMultipleWebhooks.length > 0) {
        console.log(
          `❌ Found ${orgsWithMultipleWebhooks.length} organizations still with multiple webhooks:`,
        );
        for (const org of orgsWithMultipleWebhooks) {
          console.log(`   - ${org.orgName}: ${org.webhookCount} webhooks`);
        }
      }
      if (orgsWithoutWebhooks.length > 0) {
        console.log(
          `❌ Found ${orgsWithoutWebhooks.length} organizations still without webhooks:`,
        );
        for (const org of orgsWithoutWebhooks) {
          console.log(`   - ${org.orgName}: 0 webhooks`);
        }
      }
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting webhook cleanup...\n');

    try {
      // Find orgs without webhooks
      const orgsWithoutWebhooks = await this.findOrgsWithoutWebhooks();

      // Find orgs with multiple webhooks
      const orgsWithMultipleWebhooks =
        await this.findOrgsWithMultipleWebhooks();

      if (
        orgsWithoutWebhooks.length === 0 &&
        orgsWithMultipleWebhooks.length === 0
      ) {
        console.log(
          '✅ No cleanup needed - all organizations have exactly one webhook',
        );
        return;
      }

      // Clean up orgs without webhooks first
      await this.cleanupOrgsWithoutWebhooks(orgsWithoutWebhooks);

      // Then clean up orgs with multiple webhooks
      await this.cleanupOrgsWithMultipleWebhooks(orgsWithMultipleWebhooks);

      // Validate the cleanup
      await this.validateCleanup();

      console.log('\n🎉 Webhook cleanup completed!');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  console.log('🧹 Unhook Webhook Cleanup Script');
  console.log('================================\n');

  // Check if running in dry-run mode
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  const cleanupService = new WebhookCleanupService();
  await cleanupService.run();
}

// Run the script
if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
