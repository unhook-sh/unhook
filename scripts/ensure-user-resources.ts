#!/usr/bin/env bun

/**
 * Unhook User Resource Creation Script
 *
 * This script ensures that all users in the database have the necessary resources:
 * - Users exist in Clerk (authentication)
 * - Users have organizations in Clerk and database
 * - Organizations have Stripe customers for billing
 * - Users have API keys for webhook access
 * - Users have webhooks for receiving events
 *
 * Usage:
 *   bun run scripts/ensure-user-resources.ts [--dry-run]
 *
 * Options:
 *   --dry-run    Run in dry-run mode (no actual changes made)
 *
 * Environment Variables Required:
 *   CLERK_SECRET_KEY    Clerk secret key for user management
 *   POSTGRES_URL        Database connection string
 *   STRIPE_SECRET_KEY   Stripe secret key for customer creation
 */

import { clerkClient } from '@clerk/nextjs/server';
import { createEnv } from '@t3-oss/env-core';
import { db } from '@unhook/db/client';
import { ApiKeys, OrgMembers, Orgs, Users, Webhooks } from '@unhook/db/schema';
import { upsertCustomerByOrg } from '@unhook/stripe';
import { eq, isNull } from 'drizzle-orm';
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

interface UserWithoutOrg {
  userId: string;
  userEmail: string;
  userFirstName?: string;
  userLastName?: string;
  createdAt: Date;
}

interface UserWithoutWebhook {
  userId: string;
  userEmail: string;
  orgId: string;
  orgName: string;
}

interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string; id: string }>;
  primaryEmailAddressId: string | null;
  firstName?: string;
  lastName?: string;
}

class UserResourceService {
  private clerk: ReturnType<typeof clerkClient>;
  private isDryRun: boolean;

  constructor(isDryRun = false) {
    this.clerk = clerkClient();
    this.isDryRun = isDryRun;
  }

  async findUsersWithoutOrgs(): Promise<UserWithoutOrg[]> {
    console.log('🔍 Finding users without organizations...');

    // Find users who don't have any org memberships
    const usersWithoutOrgs = await db
      .select({
        createdAt: Users.createdAt,
        email: Users.email,
        firstName: Users.firstName,
        id: Users.id,
        lastName: Users.lastName,
      })
      .from(Users)
      .leftJoin(OrgMembers, eq(Users.id, OrgMembers.userId))
      .where(isNull(OrgMembers.userId));

    return usersWithoutOrgs.map((user) => ({
      createdAt: user.createdAt,
      userEmail: user.email,
      userFirstName: user.firstName || undefined,
      userId: user.id,
      userLastName: user.lastName || undefined,
    }));
  }

  async findUsersWithoutWebhooks(): Promise<UserWithoutWebhook[]> {
    console.log('🔍 Finding users without webhooks...');

    // Find users who have org memberships but no webhooks
    const usersWithoutWebhooks = await db
      .select({
        email: Users.email,
        id: Users.id,
        orgId: Orgs.id,
        orgName: Orgs.name,
      })
      .from(Users)
      .innerJoin(OrgMembers, eq(Users.id, OrgMembers.userId))
      .innerJoin(Orgs, eq(OrgMembers.orgId, Orgs.id))
      .leftJoin(Webhooks, eq(Users.id, Webhooks.userId))
      .where(isNull(Webhooks.userId));

    return usersWithoutWebhooks.map((user) => ({
      orgId: user.orgId,
      orgName: user.orgName,
      userEmail: user.email,
      userId: user.id,
    }));
  }

  async getClerkUser(userId: string): Promise<ClerkUser | null> {
    try {
      const clerk = await this.clerk;
      const user = await clerk.users.getUser(userId);
      return {
        ...user,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      };
    } catch (error) {
      console.warn(`⚠️  Could not fetch Clerk user ${userId}:`, error);
      return null;
    }
  }

  async createUserInClerk(
    email: string,
    firstName: string,
    lastName: string,
    createdAt: Date,
  ): Promise<string | null> {
    if (this.isDryRun) {
      console.log(`      👤 Would create user "${email}" in Clerk`);
      return 'dry-run-user-id';
    }

    try {
      const clerk = await this.clerk;
      const user = await clerk.users.createUser({
        createdAt,
        emailAddress: [email],
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        legalAcceptedAt: createdAt,
      });
      console.log(`✅ Created user "${email}" in Clerk with ID: ${user.id}`);
      return user.id;
    } catch (error) {
      console.error(
        `❌ Failed to create user "${email}" in Clerk:`,
        JSON.stringify(error, null, 2),
      );
      return null;
    }
  }

  async createUserInDatabase(
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    avatarUrl?: string,
  ): Promise<boolean> {
    if (this.isDryRun) {
      console.log(`      💾 Would create user "${email}" in database`);
      return true;
    }

    try {
      const [user] = await db
        .insert(Users)
        .values({
          avatarUrl: avatarUrl || null,
          clerkId: userId,
          email,
          firstName: firstName || null,
          id: userId,
          lastName: lastName || null,
        })
        .onConflictDoUpdate({
          set: {
            avatarUrl: avatarUrl || null,
            email,
            firstName: firstName || null,
            lastName: lastName || null,
            updatedAt: new Date(),
          },
          target: Users.clerkId,
        })
        .returning();

      if (!user) {
        console.error(`❌ Failed to create user "${email}" in database`);
        return false;
      }

      console.log(
        `✅ Created/updated user "${email}" in database with ID: ${user.id}`,
      );
      return true;
    } catch (error) {
      console.error(`❌ Failed to create user "${email}" in database:`, error);
      return false;
    }
  }

  async createStripeCustomer(
    email: string,
    name: string,
    orgId: string,
    userId: string,
  ): Promise<string | null> {
    if (this.isDryRun) {
      console.log(`      💳 Would create Stripe customer for "${email}"`);
      return 'dry-run-stripe-customer-id';
    }

    try {
      const customer = await upsertCustomerByOrg({
        additionalMetadata: {
          orgName: name,
          userId,
        },
        email,
        name,
        orgId,
      });

      if (!customer) {
        console.error(`❌ Failed to create Stripe customer for "${email}"`);
        return null;
      }

      console.log(
        `✅ Created Stripe customer for "${email}" with ID: ${customer.id}`,
      );
      return customer.id;
    } catch (error) {
      console.error(
        `❌ Failed to create Stripe customer for "${email}":`,
        error,
      );
      return null;
    }
  }

  async createOrgInClerk(
    orgName: string,
    createdByUserId: string,
  ): Promise<string | null> {
    if (this.isDryRun) {
      console.log(`      📞 Would create org "${orgName}" in Clerk`);
      return 'dry-run-org-id';
    }

    try {
      const clerk = await this.clerk;
      const org = await clerk.organizations.createOrganization({
        createdBy: createdByUserId,
        name: orgName,
      });
      console.log(`✅ Created org "${orgName}" in Clerk with ID: ${org.id}`);
      return org.id;
    } catch (error) {
      console.error(`❌ Failed to create org "${orgName}" in Clerk:`, error);
      return null;
    }
  }

  async createOrgInDatabase(
    orgId: string,
    clerkOrgId: string,
    orgName: string,
    createdByUserId: string,
    stripeCustomerId: string,
  ): Promise<boolean> {
    if (this.isDryRun) {
      console.log(`      💾 Would create org "${orgName}" in database`);
      return true;
    }

    try {
      const [org] = await db
        .insert(Orgs)
        .values({
          clerkOrgId,
          createdByUserId,
          id: orgId,
          name: orgName,
          stripeCustomerId,
        })
        .returning();

      if (!org) {
        console.error(`❌ Failed to create org "${orgName}" in database`);
        return false;
      }

      console.log(`✅ Created org "${orgName}" in database with ID: ${org.id}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to create org "${orgName}" in database:`, error);
      return false;
    }
  }

  async createOrgMember(
    orgId: string,
    userId: string,
    role: 'admin' | 'user' = 'admin',
  ): Promise<boolean> {
    if (this.isDryRun) {
      console.log(
        `      👤 Would create org member for user ${userId} with role ${role}`,
      );
      return true;
    }

    try {
      const [member] = await db
        .insert(OrgMembers)
        .values({
          orgId,
          role,
          userId,
        })
        .returning();

      if (!member) {
        console.error(`❌ Failed to create org member for user ${userId}`);
        return false;
      }

      console.log(`✅ Created org member for user ${userId} with role ${role}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to create org member for user ${userId}:`,
        error,
      );
      return false;
    }
  }

  async createApiKey(
    orgId: string,
    userId: string,
    name = 'Default API Key',
  ): Promise<string | null> {
    if (this.isDryRun) {
      console.log(`      🔑 Would create API key "${name}" for org ${orgId}`);
      return 'dry-run-api-key-id';
    }

    try {
      const [apiKey] = await db
        .insert(ApiKeys)
        .values({
          name,
          orgId,
          userId,
        })
        .returning();

      if (!apiKey) {
        console.error(`❌ Failed to create API key "${name}" for org ${orgId}`);
        return null;
      }

      console.log(
        `✅ Created API key "${name}" for org ${orgId} with ID: ${apiKey.id}`,
      );
      return apiKey.id;
    } catch (error) {
      console.error(
        `❌ Failed to create API key "${name}" for org ${orgId}:`,
        error,
      );
      return null;
    }
  }

  async createWebhook(
    orgId: string,
    userId: string,
    apiKeyId: string,
    name = 'Default',
  ): Promise<boolean> {
    if (this.isDryRun) {
      console.log(`      🔗 Would create webhook "${name}" for user ${userId}`);
      return true;
    }

    try {
      const [webhook] = await db
        .insert(Webhooks)
        .values({
          apiKeyId,
          isPrivate: false,
          name,
          orgId,
          userId,
        })
        .returning();

      if (!webhook) {
        console.error(
          `❌ Failed to create webhook "${name}" for user ${userId}`,
        );
        return false;
      }

      console.log(
        `✅ Created webhook "${name}" for user ${userId} with ID: ${webhook.id}`,
      );
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to create webhook "${name}" for user ${userId}:`,
        error,
      );
      return false;
    }
  }

  async ensureUserExists(user: UserWithoutOrg): Promise<void> {
    console.log(
      `\n👤 Ensuring user exists: ${user.userEmail} (${user.userId})`,
    );

    // Check if user exists in Clerk
    const clerkUser = await this.getClerkUser(user.userId);
    if (!clerkUser) {
      console.log('   ⚠️  User not found in Clerk, creating...');

      // Create user in Clerk
      const newClerkUserId = await this.createUserInClerk(
        user.userEmail,
        user.userFirstName || '',
        user.userLastName || '',
        user.createdAt,
      );

      if (!newClerkUserId) {
        console.log('   ❌ Failed to create user in Clerk, skipping');
        return;
      }

      // Update the user ID to the new Clerk user ID
      user.userId = newClerkUserId;
    }

    // Ensure user exists in database
    const userCreated = await this.createUserInDatabase(
      user.userId,
      user.userEmail,
      user.userFirstName,
      user.userLastName,
    );

    if (!userCreated) {
      console.log('   ❌ Failed to create user in database, skipping');
      return;
    }

    console.log('   ✅ User exists in both Clerk and database');
  }

  async ensureUserHasOrg(user: UserWithoutOrg): Promise<void> {
    console.log(
      `\n🏗️  Ensuring user has organization: ${user.userEmail} (${user.userId})`,
    );

    // Ensure user exists first
    await this.ensureUserExists(user);

    // Get user details from Clerk
    const clerkUser = await this.getClerkUser(user.userId);
    if (!clerkUser) {
      console.log('   ⚠️  Could not fetch Clerk user, skipping');
      return;
    }

    // Generate org name based on user's name or email
    const orgName = this.generateOrgName(clerkUser, user);

    // Create Stripe customer first
    const stripeCustomerId = await this.createStripeCustomer(
      user.userEmail,
      orgName,
      user.userId, // Use userId as temporary orgId
      user.userId,
    );

    if (!stripeCustomerId) {
      console.log('   ❌ Failed to create Stripe customer, skipping');
      return;
    }

    // Create org in Clerk
    const clerkOrgId = await this.createOrgInClerk(orgName, user.userId);
    if (!clerkOrgId) {
      console.log('   ❌ Failed to create org in Clerk, skipping');
      return;
    }

    // Create org in database
    const orgCreated = await this.createOrgInDatabase(
      clerkOrgId,
      clerkOrgId,
      orgName,
      user.userId,
      stripeCustomerId,
    );
    if (!orgCreated) {
      console.log('   ❌ Failed to create org in database, skipping');
      return;
    }

    // Create org member
    const memberCreated = await this.createOrgMember(
      clerkOrgId,
      user.userId,
      'admin',
    );
    if (!memberCreated) {
      console.log('   ❌ Failed to create org member, skipping');
      return;
    }

    console.log(
      `   ✅ Successfully created organization "${orgName}" for user`,
    );
  }

  async ensureUserHasWebhook(user: UserWithoutWebhook): Promise<void> {
    console.log(
      `\n🔗 Ensuring user has webhook: ${user.userEmail} (${user.userId})`,
    );
    console.log(`   Organization: ${user.orgName} (${user.orgId})`);

    // Create API key first (required for webhook)
    const apiKeyId = await this.createApiKey(user.orgId, user.userId);
    if (!apiKeyId) {
      console.log('   ❌ Failed to create API key, skipping webhook creation');
      return;
    }

    const webhookCreated = await this.createWebhook(
      user.orgId,
      user.userId,
      apiKeyId,
    );
    if (webhookCreated) {
      console.log('   ✅ Successfully created webhook for user');
    } else {
      console.log('   ❌ Failed to create webhook for user');
    }
  }

  generateOrgName(clerkUser: ClerkUser, user: UserWithoutOrg): string {
    // Try to use the user's name from Clerk first
    if (clerkUser.firstName && clerkUser.lastName) {
      return `${clerkUser.firstName}'s Team`;
    }
    if (clerkUser.firstName) {
      return `${clerkUser.firstName}'s Team`;
    }

    // Fall back to the database user's name
    if (user.userFirstName && user.userLastName) {
      return `${user.userFirstName}'s Team`;
    }
    if (user.userFirstName) {
      return `${user.userFirstName}'s Team`;
    }

    // Fall back to email-based name
    const emailName = user.userEmail.split('@')[0];
    const capitalizedName =
      emailName.charAt(0).toUpperCase() + emailName.slice(1);
    return `${capitalizedName}'s Team`;
  }

  async validateResources(): Promise<void> {
    console.log('\n🔍 Validating user resources...');

    const usersWithoutOrgs = await this.findUsersWithoutOrgs();
    const usersWithoutWebhooks = await this.findUsersWithoutWebhooks();

    if (usersWithoutOrgs.length === 0 && usersWithoutWebhooks.length === 0) {
      console.log('✅ All users have organizations and webhooks');
    } else {
      console.log(
        `⚠️  Found ${usersWithoutOrgs.length} users without organizations`,
      );
      console.log(
        `⚠️  Found ${usersWithoutWebhooks.length} users without webhooks`,
      );
    }
  }

  async run(): Promise<void> {
    console.log('🏗️  Unhook User Resource Creation Script');
    console.log('==========================================');
    if (this.isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
    }
    console.log('🚀 Starting user resource creation...\n');

    // Find users without organizations
    const usersWithoutOrgs = await this.findUsersWithoutOrgs();
    console.log(`Found ${usersWithoutOrgs.length} users without organizations`);

    // Create organizations for users who don't have them
    if (usersWithoutOrgs.length > 0) {
      console.log('\n🏗️  Creating missing organizations...');
      for (const user of usersWithoutOrgs) {
        await this.ensureUserHasOrg(user);
      }
    }

    // Find users without webhooks
    const usersWithoutWebhooks = await this.findUsersWithoutWebhooks();
    console.log(`Found ${usersWithoutWebhooks.length} users without webhooks`);

    // Create webhooks for users who don't have them
    if (usersWithoutWebhooks.length > 0) {
      console.log('\n🔗 Creating missing webhooks...');
      for (const user of usersWithoutWebhooks) {
        await this.ensureUserHasWebhook(user);
      }
    }

    // Validate the results
    await this.validateResources();

    console.log('\n🎉 User resource creation completed!');

    if (this.isDryRun) {
      console.log('\n📝 Summary of what would be created:');
      console.log('   • Users in Clerk (if missing)');
      console.log('   • Users in database (if missing)');
      console.log('   • Organizations in Clerk and database');
      console.log('   • Stripe customers for billing');
      console.log('   • API keys for webhook access');
      console.log('   • Webhooks for receiving events');
      console.log(
        '\n   Run without --dry-run to actually create these resources.',
      );
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  try {
    const service = new UserResourceService(isDryRun);
    await service.run();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
