#!/usr/bin/env bun

import { clerkClient } from '@clerk/nextjs/server';
import { createEnv } from '@t3-oss/env-core';
import { db } from '@unhook/db/client';
import { OrgMembers, Orgs, Users, Webhooks } from '@unhook/db/schema';
import { eq, isNull } from 'drizzle-orm';
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

interface UserWithoutOrg {
  userId: string;
  userEmail: string;
  userFirstName?: string;
  userLastName?: string;
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
        email: Users.email,
        firstName: Users.firstName,
        id: Users.id,
        lastName: Users.lastName,
      })
      .from(Users)
      .leftJoin(OrgMembers, eq(Users.id, OrgMembers.userId))
      .where(isNull(OrgMembers.userId));

    return usersWithoutOrgs.map((user) => ({
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

  async createWebhook(
    orgId: string,
    userId: string,
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

  async ensureUserHasOrg(user: UserWithoutOrg): Promise<void> {
    console.log(
      `\n🏗️  Ensuring user has organization: ${user.userEmail} (${user.userId})`,
    );

    // Get user details from Clerk
    const clerkUser = await this.getClerkUser(user.userId);
    if (!clerkUser) {
      console.log('   ⚠️  Could not fetch Clerk user, skipping');
      return;
    }

    // Generate org name based on user's name or email
    const orgName = this.generateOrgName(clerkUser, user);

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

    const webhookCreated = await this.createWebhook(user.orgId, user.userId);
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
