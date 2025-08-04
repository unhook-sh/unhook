import { createClerkClient } from '@clerk/backend';
import { db } from '@unhook/db/client';
import { ApiKeys, AuthCodes, Orgs, Users, Webhooks } from '@unhook/db/schema';
import { createId } from '@unhook/id';
import { eq } from 'drizzle-orm';
import { env } from './env';

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  clerkId: string;
}

export interface TestOrg {
  id: string;
  name: string;
  clerkOrgId: string;
  ownerId: string;
}

export interface TestApiKey {
  id: string;
  key: string;
  name: string;
  orgId: string;
  userId: string;
}

export interface TestWebhook {
  id: string;
  name: string;
  orgId: string;
  userId: string;
  apiKeyId: string;
  isPrivate: boolean;
}

export interface TestAuthCode {
  id: string;
  userId: string;
  orgId: string;
  expiresAt: Date;
  sessionId: string;
}

export interface TestSetup {
  user: TestUser;
  org: TestOrg;
  apiKey: TestApiKey;
  webhook: TestWebhook;
  authCode?: TestAuthCode;
  cleanup: () => Promise<void>;
}

const clerkClient = createClerkClient({
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
  secretKey: env.CLERK_SECRET_KEY,
});

/**
 * Creates a test user in Clerk and the database
 */
export async function createTestUser(
  email = `test-${Date.now()}@example.com`,
  firstName = 'Test',
  lastName = 'User',
): Promise<TestUser> {
  try {
    // Create user in Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName,
      lastName,
      legalAcceptedAt: new Date(),
      password: createId(),
      skipLegalChecks: true,
      skipPasswordChecks: true,
    });

    if (!clerkUser.id) {
      throw new Error('Failed to create Clerk user');
    }

    // Create user in database
    const [dbUser] = await db
      .insert(Users)
      .values({
        clerkId: clerkUser.id,
        email,
        firstName,
        id: clerkUser.id,
        lastName,
      })
      .returning();

    if (!dbUser) {
      throw new Error('Failed to create user in database');
    }

    return {
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      firstName: dbUser.firstName || firstName,
      id: dbUser.id,
      lastName: dbUser.lastName || lastName,
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Creates a test organization in Clerk and the database
 */
export async function createTestOrg(
  ownerId: string,
  name = `Test Organization ${Date.now()}`,
): Promise<TestOrg> {
  // Create organization in Clerk
  const clerkOrg = await clerkClient.organizations.createOrganization({
    createdBy: ownerId,
    name,
  });

  if (!clerkOrg.id) {
    throw new Error('Failed to create Clerk organization');
  }

  // Create organization in database
  const [dbOrg] = await db
    .insert(Orgs)
    .values({
      clerkOrgId: clerkOrg.id,
      createdByUserId: ownerId,
      id: clerkOrg.id,
      name,
    })
    .returning();

  if (!dbOrg) {
    throw new Error('Failed to create organization in database');
  }

  return {
    clerkOrgId: dbOrg.clerkOrgId,
    id: dbOrg.id,
    name: dbOrg.name,
    ownerId: dbOrg.createdByUserId,
  };
}

/**
 * Creates a test auth code in the database with a real Clerk session
 */
export async function createTestAuthCode(
  userId: string,
  orgId: string,
  expiresInMinutes = 30,
): Promise<TestAuthCode> {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Create a real Clerk session for the user
  const session = await clerkClient.sessions.createSession({
    userId,
  });

  const [authCode] = await db
    .insert(AuthCodes)
    .values({
      expiresAt,
      orgId,
      sessionId: session.id,
      userId,
    })
    .returning();

  if (!authCode) {
    throw new Error('Failed to create auth code in database');
  }

  return {
    expiresAt: authCode.expiresAt,
    id: authCode.id,
    orgId: authCode.orgId,
    sessionId: authCode.sessionId,
    userId: authCode.userId,
  };
}

/**
 * Creates a test API key in the database
 */
export async function createTestApiKey(
  orgId: string,
  userId: string,
  name = 'Test API Key',
): Promise<TestApiKey> {
  const [apiKey] = await db
    .insert(ApiKeys)
    .values({
      name,
      orgId,
      userId,
    })
    .returning();

  if (!apiKey) {
    throw new Error('Failed to create API key in database');
  }

  return {
    id: apiKey.id,
    key: apiKey.key,
    name: apiKey.name,
    orgId: apiKey.orgId,
    userId: apiKey.userId,
  };
}

/**
 * Creates a test webhook in the database
 */
export async function createTestWebhook(
  orgId: string,
  userId: string,
  apiKeyId: string,
  name = 'Test Webhook',
  isPrivate = false,
): Promise<TestWebhook> {
  const [webhook] = await db
    .insert(Webhooks)
    .values({
      apiKeyId,
      isPrivate,
      name,
      orgId,
      userId,
    })
    .returning();

  if (!webhook) {
    throw new Error('Failed to create webhook in database');
  }

  return {
    apiKeyId: webhook.apiKeyId,
    id: webhook.id,
    isPrivate: webhook.isPrivate,
    name: webhook.name,
    orgId: webhook.orgId,
    userId: webhook.userId,
  };
}

/**
 * Creates a complete test setup with user, org, API key, webhook, and optional auth code
 */
export async function createTestSetup(
  options: {
    userEmail?: string;
    userName?: { firstName?: string; lastName?: string };
    orgName?: string;
    webhookName?: string;
    apiKeyName?: string;
    isPrivate?: boolean;
    createAuthCode?: boolean;
    authCodeExpiresInMinutes?: number;
  } = {},
): Promise<TestSetup> {
  const {
    userEmail,
    userName,
    orgName,
    webhookName = 'Test Webhook',
    apiKeyName = 'Test API Key',
    isPrivate = false,
    createAuthCode = false,
    authCodeExpiresInMinutes = 30,
  } = options;

  // Create test user
  const user = await createTestUser(
    userEmail,
    userName?.firstName,
    userName?.lastName,
  );

  // Create test organization
  const org = await createTestOrg(user.id, orgName);

  // Create test API key
  const apiKey = await createTestApiKey(org.id, user.id, apiKeyName);

  // Create test webhook
  const webhook = await createTestWebhook(
    org.id,
    user.id,
    apiKey.id,
    webhookName,
    isPrivate,
  );

  let authCode: TestAuthCode | undefined;

  if (createAuthCode) {
    authCode = await createTestAuthCode(
      user.id,
      org.id,
      authCodeExpiresInMinutes,
    );
  }

  // Create cleanup function
  const cleanup = async () => {
    try {
      // Clean up auth code if it exists
      if (authCode) {
        // Clean up Clerk session if auth code exists
        try {
          await clerkClient.sessions.revokeSession(authCode.sessionId);
        } catch (error) {
          console.warn('Failed to revoke Clerk session:', error);
        }

        await db.delete(AuthCodes).where(eq(AuthCodes.id, authCode.id));
      }

      // Clean up webhook from database
      await db.delete(Webhooks).where(eq(Webhooks.id, webhook.id));

      // Clean up API key from database
      await db.delete(ApiKeys).where(eq(ApiKeys.id, apiKey.id));

      // Clean up organization from database
      await db.delete(Orgs).where(eq(Orgs.id, org.id));

      // Clean up user from database
      await db.delete(Users).where(eq(Users.id, user.id));

      // Clean up organization from Clerk
      try {
        await clerkClient.organizations.deleteOrganization(org.clerkOrgId);
      } catch (error) {
        console.warn('Failed to delete Clerk organization:', error);
      }

      // Clean up user from Clerk
      try {
        await clerkClient.users.deleteUser(user.clerkId);
      } catch (error) {
        console.warn('Failed to delete Clerk user:', error);
      }
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  };

  return {
    apiKey,
    authCode,
    cleanup,
    org,
    user,
    webhook,
  };
}

/**
 * Utility to create an expired auth code for testing
 */
export async function createExpiredAuthCode(
  userId: string,
  orgId: string,
): Promise<TestAuthCode> {
  const expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

  // Create a real Clerk session for the user
  const session = await clerkClient.sessions.createSession({
    userId,
  });

  const [authCode] = await db
    .insert(AuthCodes)
    .values({
      expiresAt,
      id: `test-expired-auth-code-${Date.now()}`,
      orgId,
      sessionId: session.id,
      userId,
    })
    .returning();

  if (!authCode) {
    throw new Error('Failed to create expired auth code in database');
  }

  return {
    expiresAt: authCode.expiresAt,
    id: authCode.id,
    orgId: authCode.orgId,
    sessionId: authCode.sessionId,
    userId: authCode.userId,
  };
}

/**
 * Utility to create a used auth code for testing
 */
export async function createUsedAuthCode(
  userId: string,
  orgId: string,
): Promise<TestAuthCode> {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

  // Create a real Clerk session for the user
  const session = await clerkClient.sessions.createSession({
    userId,
  });

  const [authCode] = await db
    .insert(AuthCodes)
    .values({
      expiresAt,
      id: `test-used-auth-code-${Date.now()}`,
      orgId,
      sessionId: session.id,
      usedAt: new Date(), // Mark as used
      userId,
    })
    .returning();

  if (!authCode) {
    throw new Error('Failed to create used auth code in database');
  }

  return {
    expiresAt: authCode.expiresAt,
    id: authCode.id,
    orgId: authCode.orgId,
    sessionId: authCode.sessionId,
    userId: authCode.userId,
  };
}
