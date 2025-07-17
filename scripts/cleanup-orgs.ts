#!/usr/bin/env bun

import { clerkClient } from '@clerk/nextjs/server';
import { createEnv } from '@t3-oss/env-core';
import { db } from '@unhook/db/client';
import { OrgMembers, Orgs, Users } from '@unhook/db/schema';
import { count, eq, gt } from 'drizzle-orm';
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

interface UserOrgCount {
  userId: string;
  userEmail: string;
  orgCount: number;
  orgIds: string[];
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

class OrgCleanupService {
  private clerk: ReturnType<typeof clerkClient>;

  constructor() {
    this.clerk = clerkClient();
  }

  async findUsersWithMultipleOrgs(): Promise<UserOrgCount[]> {
    console.log('🔍 Finding users with multiple organizations...');

    const result = await db
      .select({
        orgCount: count(OrgMembers.orgId),
        // orgIds: OrgMembers.orgId,
        userId: OrgMembers.userId,
      })
      .from(OrgMembers)
      .groupBy(OrgMembers.userId)
      .having(gt(count(OrgMembers.orgId), 1));

    const userOrgCounts: UserOrgCount[] = [];

    for (const row of result) {
      // Get all orgs for this user
      const userOrgs = await db
        .select({ orgId: OrgMembers.orgId })
        .from(OrgMembers)
        .where(eq(OrgMembers.userId, row.userId));

      const orgIds = userOrgs.map((org) => org.orgId);

      // Get user email
      const user = await db
        .select({ email: Users.email })
        .from(Users)
        .where(eq(Users.id, row.userId))
        .limit(1);

      userOrgCounts.push({
        orgCount: Number(row.orgCount),
        orgIds,
        userEmail: user[0]?.email || 'unknown',
        userId: row.userId,
      });
    }

    return userOrgCounts;
  }

  async getOrgDetails(
    orgIds: string[],
  ): Promise<Map<string, typeof Orgs.$inferSelect>> {
    const orgDetails = new Map<string, typeof Orgs.$inferSelect>();

    for (const orgId of orgIds) {
      const org = await db
        .select()
        .from(Orgs)
        .where(eq(Orgs.id, orgId))
        .limit(1);

      if (org[0]) {
        orgDetails.set(orgId, org[0]);
      }
    }

    return orgDetails;
  }

  async getClerkUser(userId: string): Promise<ClerkUser | null> {
    try {
      const clerk = await this.clerk;
      return await clerk.users.getUser(userId);
    } catch (error) {
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
      // Delete org members first (due to foreign key constraints)
      await db.delete(OrgMembers).where(eq(OrgMembers.orgId, orgId));

      // Delete the org
      await db.delete(Orgs).where(eq(Orgs.id, orgId));

      console.log(`✅ Deleted org ${orgId} from database`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete org ${orgId} from database:`, error);
      return false;
    }
  }

  async cleanupUserOrgs(userOrgCount: UserOrgCount): Promise<void> {
    console.log(
      `\n🧹 Cleaning up orgs for user: ${userOrgCount.userEmail} (${userOrgCount.userId})`,
    );
    console.log(`   Found ${userOrgCount.orgCount} organizations`);

    const orgDetails = await this.getOrgDetails(userOrgCount.orgIds);

    // Sort orgs by creation date (keep the oldest one)
    const sortedOrgs = userOrgCount.orgIds
      .map((orgId) => ({ details: orgDetails.get(orgId), orgId }))
      .filter(
        (org): org is { details: typeof Orgs.$inferSelect; orgId: string } =>
          org.details !== undefined,
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

    if (sortedOrgs.length === 0) {
      console.log('   ⚠️  No valid orgs found for user');
      return;
    }

    // Keep the oldest org (first in sorted array)
    const orgToKeep = sortedOrgs[0];
    const orgsToDelete = sortedOrgs.slice(1);

    console.log(
      `   📋 Keeping org: ${orgToKeep.orgId} (${orgToKeep.details.name}) - created ${orgToKeep.details.createdAt}`,
    );
    console.log(`   🗑️  Deleting ${orgsToDelete.length} duplicate org(s):`);

    for (const org of orgsToDelete) {
      console.log(
        `      - ${org.orgId} (${org.details.name}) - created ${org.details.createdAt}`,
      );

      // Check if org exists in Clerk
      const clerkOrg = await this.getClerkOrg(org.orgId);

      if (clerkOrg) {
        console.log('      📞 Found in Clerk, deleting...');
        await this.deleteOrgFromClerk(org.orgId);
      } else {
        console.log('      📞 Not found in Clerk, skipping Clerk deletion');
      }

      // Delete from database
      await this.deleteOrgFromDatabase(org.orgId);
    }
  }

  async validateCleanup(): Promise<void> {
    console.log('\n🔍 Validating cleanup...');

    const usersWithMultipleOrgs = await this.findUsersWithMultipleOrgs();

    if (usersWithMultipleOrgs.length === 0) {
      console.log('✅ All users now have at most one organization');
    } else {
      console.log(
        `❌ Found ${usersWithMultipleOrgs.length} users still with multiple orgs:`,
      );
      for (const user of usersWithMultipleOrgs) {
        console.log(`   - ${user.userEmail}: ${user.orgCount} orgs`);
      }
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting organization cleanup...\n');

    try {
      // Find users with multiple orgs
      const usersWithMultipleOrgs = await this.findUsersWithMultipleOrgs();

      if (usersWithMultipleOrgs.length === 0) {
        console.log('✅ No users found with multiple organizations');
        return;
      }

      console.log(
        `Found ${usersWithMultipleOrgs.length} users with multiple organizations:\n`,
      );

      // Process each user
      for (const userOrgCount of usersWithMultipleOrgs) {
        await this.cleanupUserOrgs(userOrgCount);
      }

      // Validate the cleanup
      await this.validateCleanup();

      console.log('\n🎉 Organization cleanup completed!');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  console.log('🧹 Unhook Organization Cleanup Script');
  console.log('=====================================\n');

  // Check if running in dry-run mode
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  const cleanupService = new OrgCleanupService();
  await cleanupService.run();
}

// Run the script
if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
