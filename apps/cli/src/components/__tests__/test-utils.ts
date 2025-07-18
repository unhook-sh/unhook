import { createHash } from 'node:crypto';
import type { User } from '@clerk/express';
import { clerkClient } from '@clerk/express';
import { eq } from '@unhook/db';
import { db } from '@unhook/db/client';
import type { OrgType, UserType, WebhookType } from '@unhook/db/schema';
import { Orgs, Users, Webhooks } from '@unhook/db/schema';
import { createClient } from '@unhook/db/supabase/cli';
import { createId } from '@unhook/id';
import { UnhookLogger } from '@unhook/logger';
import { ConsoleDestination } from '@unhook/logger/destinations/console';

// Create logger with debug level enabled
export const logger = new UnhookLogger({
  defaultNamespace: 'test',
  destinations: [new ConsoleDestination()],
  enabledNamespaces: new Set(['*', 'test', 'test:*', 'clerk:*', 'unhook:*']),
  useColors: true,
});

export const testLogger = logger.debug('test');

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock user and org data
export const mockUser = {
  avatarUrl: null, // will be set after user creation
  clerkId: '', // Will be set after user creation
  createdAt: new Date(),
  email: 'your_email+clerk_test1@example.com',
  firstName: 'Test',
  id: '',
  lastLoggedInAt: new Date(),
  lastName: 'User',
  online: true,
  updatedAt: new Date(),
} satisfies UserType;

export const orgId = createId({ prefix: 'org' });
export const mockOrg = {
  clerkOrgId: orgId,
  createdAt: new Date(),
  createdByUserId: mockUser.id,
  id: orgId,
  name: 'Test Organization',
  stripeCustomerId: 'cus_1234567890',
  stripeSubscriptionId: 'sub_1234567890',
  stripeSubscriptionStatus: 'active',
  updatedAt: new Date(),
} satisfies OrgType;

// Mock webhook data
export const mockWebhook = {
  apiKeyId: createId({ prefix: 'whsk' }),
  config: {
    headers: {},
    requests: {},
    storage: {
      maxRequestBodySize: 1024 * 1024,
      maxResponseBodySize: 1024 * 1024,
      storeHeaders: true,
      storeRequestBody: true, // 1MB
      storeResponseBody: true, // 1MB
    },
  },
  createdAt: new Date(),
  id: createId({ prefix: 'wh' }),
  isPrivate: false,
  name: 'Test Webhook',
  orgId: orgId,
  requestCount: 0,
  status: 'active' as const,
  updatedAt: new Date(),
} satisfies Omit<WebhookType, 'userId'>;

export async function createTestWebhook(overrides: Partial<WebhookType> = {}) {
  const webhook = {
    ...mockWebhook,
    apiKeyId: createId({ prefix: 'whsk' }),
    id: createId({ prefix: 'wh' }),
    userId: mockUser.id,
    ...overrides,
  };

  try {
    // Check if webhook exists
    const existingWebhook = await db.query.Webhooks.findFirst({
      where: eq(Webhooks.id, webhook.id),
    });

    if (!existingWebhook) {
      await db.insert(Webhooks).values(webhook);
      testLogger('[test:webhook] Created webhook:', webhook.id);
    } else {
      testLogger('[test:webhook] Webhook already exists:', webhook.id);
    }

    return webhook;
  } catch (error) {
    testLogger('[test:webhook:error] Failed to create webhook:', error);
    throw error;
  }
}

export async function setupTestEnvironment(): Promise<{
  supabase: ReturnType<typeof createClient>;
  createdClerkUser: User;
}> {
  let supabase: ReturnType<typeof createClient>;
  let createdClerkUser: User;

  try {
    testLogger('[test:setup] Starting test setup...');

    // Try to find existing Clerk user first
    testLogger('[test:clerk] Checking for existing Clerk user...');
    try {
      const existingUsers = await clerkClient.users.getUserList({
        emailAddress: [mockUser.email],
      });

      const existingUser = existingUsers.data?.[0];
      if (existingUser) {
        createdClerkUser = existingUser;
        testLogger('[test:clerk] Found existing Clerk user:');
      } else {
        // Create a test user in Clerk
        testLogger('[test:clerk] Creating new Clerk user...');
        // Create a password hash using SHA-256
        const password = 'test-password-123';
        const passwordDigest = createHash('sha256')
          .update(password)
          .digest('hex');
        testLogger('[test:clerk] Generated password digest');

        createdClerkUser = await clerkClient.users.createUser({
          emailAddress: [mockUser.email],
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          passwordDigest,
          passwordHasher: 'sha256',
          skipLegalChecks: true,
          skipPasswordChecks: true,
          skipPasswordRequirement: true,
        });
        testLogger(
          '[test:clerk] Successfully created Clerk user:',
          createdClerkUser.id,
        );
      }
    } catch (error) {
      testLogger(
        '[test:clerk:error] Failed to handle Clerk user:',
        JSON.stringify(error),
      );
      throw error;
    }

    if (!createdClerkUser || !createdClerkUser.id) {
      throw new Error('Failed to create Clerk user - no user ID returned');
    }

    // Update mockUser with the created Clerk ID
    mockUser.id = createdClerkUser.id;
    mockUser.clerkId = createdClerkUser.id;
    testLogger(
      '[test:clerk] Updated mockUser with Clerk ID:',
      mockUser.clerkId,
    );

    // Create a session for the test user
    testLogger('[test:clerk] Creating session...');
    try {
      const session = await clerkClient.sessions.createSession({
        userId: createdClerkUser.id,
      });
      testLogger('[test:clerk] Created session');

      const authToken = await clerkClient.sessions.getToken(
        session.id,
        'cli-test',
      );
      testLogger('[test:clerk] Got auth token');

      const url = 'http://localhost:54321';
      // Create Supabase client with realtime configuration
      supabase = createClient({
        authToken: authToken.jwt,
        url,
      });
      testLogger('[test:clerk] Created Supabase client', {
        url,
      });

      // Explicitly connect to realtime
      testLogger('[test:clerk] Connecting to realtime...');
      supabase.realtime.connect();
      await wait(3000);
      testLogger('[test:clerk] Supabase client config:', {
        connectionState: supabase.realtime.connectionState(),
        realtimeConnected: supabase.realtime.isConnected(),
      });
    } catch (error) {
      testLogger('[test:clerk:error] Failed to create session:', error);
      throw error;
    }

    // Set up test data
    testLogger('[test:setup] Setting up test data...');
    try {
      await db.insert(Users).values(mockUser).onConflictDoUpdate({
        set: mockUser,
        target: Users.id,
      });

      await db
        .insert(Orgs)
        .values({
          ...mockOrg,
          createdByUserId: mockUser.id,
        })
        .onConflictDoUpdate({
          set: {
            ...mockOrg,
            createdByUserId: mockUser.id,
          },
          target: Orgs.id,
        });

      await db.insert(Webhooks).values({
        ...mockWebhook,
        orgId: mockOrg.id,
        userId: mockUser.id,
      });

      testLogger('[test:setup] Test data setup complete');
    } catch (error) {
      testLogger('[test:setup:error] Failed to set up test data:', error);
      throw error;
    }

    // Wait for client to be ready
    await wait(3000);
    testLogger('[test:setup] Setup complete');

    return { createdClerkUser, supabase };
  } catch (error) {
    testLogger('[test:error] Error in setupTestEnvironment:', error);
    if (error instanceof Error) {
      testLogger('[test:error] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }
    throw error;
  }
}

export async function cleanupTestEnvironment(createdClerkUser: User) {
  try {
    // Clean up test data
    await db.delete(Webhooks).where(eq(Webhooks.id, mockWebhook.id));
    await db.delete(Orgs).where(eq(Orgs.id, mockOrg.id));
    await db.delete(Users).where(eq(Users.id, mockUser.id));

    // Delete the test user from Clerk
    if (createdClerkUser) {
      await clerkClient.users.deleteUser(createdClerkUser.id);
      testLogger('[test:cleanup] Deleted Clerk user:', createdClerkUser.id);
    }
  } catch (error) {
    testLogger('[test:error] Error in cleanupTestEnvironment:', error);
    throw error;
  }
}
