import { describe, expect, it } from 'bun:test';
import { createHash } from 'node:crypto';
import type { User } from '@clerk/express';
import { clerkClient } from '@clerk/express';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import type { Tables } from '@unhook/db';
import { eq } from '@unhook/db';
import { db } from '@unhook/db/client';
import type { EventType } from '@unhook/db/schema';
import { Events, Orgs, Users, Webhooks } from '@unhook/db/schema';
import { createClient } from '@unhook/db/supabase/cli';
import { createId } from '@unhook/id';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe.skip('RealtimeSubscription', () => {
  it(
    'should handle real-time subscription events',
    async () => {
      console.log('[test] Starting realtime subscription test...');

      // Create test user in Clerk
      const email = 'your_email+clerk_test1@example.com';
      const password = 'test-password-123';
      console.log('[test] Using test email:', email);

      const passwordDigest = createHash('sha256')
        .update(password)
        .digest('hex');

      // Check for existing user first
      let createdClerkUser: User;
      try {
        console.log('[test] Checking for existing Clerk user...');
        const existingUsers = await clerkClient.users.getUserList({
          emailAddress: [email],
        });

        const existingUser = existingUsers.data?.[0];
        if (existingUser?.id) {
          console.log(
            '[test:clerk] Found existing Clerk user:',
            existingUser.id,
          );
          createdClerkUser = existingUser;
        } else {
          console.log('[test:clerk] Creating new Clerk user...');
          createdClerkUser = await clerkClient.users.createUser({
            emailAddress: [email],
            passwordDigest,
            passwordHasher: 'sha256',
            skipLegalChecks: true,
            skipPasswordChecks: true,
            skipPasswordRequirement: true,
            firstName: 'Test',
            lastName: 'User',
          });
          console.log(
            '[test:clerk] Created new Clerk user:',
            createdClerkUser.id,
          );
        }
      } catch (error) {
        console.log('[test:clerk:error] Failed to handle Clerk user:', error);
        throw error;
      }

      // Create session and get auth token
      console.log('[test] Creating Clerk session...');
      const session = await clerkClient.sessions.createSession({
        userId: createdClerkUser.id,
      });
      console.log('[test] Created session:', session.id);

      const authToken = await clerkClient.sessions.getToken(
        session.id,
        'cli-test',
      );
      console.log('[test] Got auth token');

      // Create Supabase client
      console.log('[test] Creating Supabase client...');
      const supabase = createClient({
        authToken: authToken.jwt,
        url: 'http://localhost:54321',
      });

      // Connect to realtime with timeout
      console.log('[test] Connecting to realtime...');
      supabase.realtime.connect();
      await Promise.race([
        new Promise<void>((resolve) => {
          const checkConnection = () => {
            if (supabase.realtime.isConnected()) {
              console.log('[test] Successfully connected to realtime');
              resolve();
            } else {
              console.log('[test] Waiting for realtime connection...');
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout connecting to realtime')),
            5000,
          ),
        ),
      ]);

      // Create test webhook
      const webhookId = createId({ prefix: 'wh' });
      const orgId = createId({ prefix: 'org' });
      console.log(
        '[test] Created test IDs - webhookId:',
        webhookId,
        'orgId:',
        orgId,
      );

      // Upsert user
      console.log('[test] Upserting user...');
      await db
        .insert(Users)
        .values({
          id: createdClerkUser.id,
          clerkId: createdClerkUser.id,
          email: createdClerkUser.emailAddresses[0]?.emailAddress ?? '',
          firstName: createdClerkUser.firstName,
          lastName: createdClerkUser.lastName,
          avatarUrl: createdClerkUser.imageUrl,
          lastLoggedInAt: new Date(),
          online: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: Users.id,
          set: {
            updatedAt: new Date(),
          },
        });
      console.log('[test] User upserted successfully');

      // Upsert org
      console.log('[test] Upserting organization...');
      await db
        .insert(Orgs)
        .values({
          id: orgId,
          clerkOrgId: orgId,
          name: 'Test Organization',
          createdByUserId: createdClerkUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: Orgs.id,
          set: {
            updatedAt: new Date(),
          },
        });
      console.log('[test] Organization upserted successfully');

      // Upsert webhook
      console.log('[test] Upserting webhook...');
      await db
        .insert(Webhooks)
        .values({
          id: webhookId,
          name: 'Test Webhook',
          requestCount: 0,
          config: {
            storage: {
              storeHeaders: true,
              storeRequestBody: true,
              storeResponseBody: true,
              maxRequestBodySize: 1024 * 1024,
              maxResponseBodySize: 1024 * 1024,
            },
            headers: {},
            requests: {},
          },
          status: 'active',
          isPrivate: false,
          apiKey: createId({ prefix: 'whsk' }),
          createdAt: new Date(),
          updatedAt: new Date(),
          orgId,
          userId: createdClerkUser.id,
        })
        .onConflictDoUpdate({
          target: Webhooks.id,
          set: {
            updatedAt: new Date(),
          },
        });
      console.log('[test] Webhook upserted successfully');

      // Create test event
      console.log('[test] Creating test event...');
      const testEvent: EventType = {
        id: createId({ prefix: 'evt' }),
        webhookId,
        originRequest: {
          method: 'POST',
          id: createId({ prefix: 'req' }),
          headers: {
            'Content-Type': 'application/json',
          },
          sourceUrl: 'https://example.com',
          size: 100,
          contentType: 'application/json',
          clientIp: '127.0.0.1',
          body: JSON.stringify({ test: 'data' }),
        },
        source: 'test',
        status: 'pending',
        timestamp: new Date(),
        userId: createdClerkUser.id,
        orgId,
        createdAt: new Date(),
        updatedAt: null,
        apiKey: null,
        failedReason: null,
        retryCount: 0,
        maxRetries: 3,
      };
      console.log('[test] Test event created with ID:', testEvent.id);

      // Set up realtime channel
      const channelName = `test-${new Date().toISOString()}`;
      console.log('[test] Setting up realtime channel:', channelName);
      const channel = supabase.channel(channelName);

      // Create a promise that will resolve when we receive the payload
      console.log('[test] Setting up payload listener...');
      const payloadPromise = new Promise<
        RealtimePostgresInsertPayload<Tables<'events'>>
      >((resolve) => {
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'events',
          },
          (payload) => {
            console.log('[test] Received payload:', payload);
            if (payload.new) {
              resolve(
                payload as RealtimePostgresInsertPayload<Tables<'events'>>,
              );
            }
          },
        );
      });

      // Subscribe to the channel with timeout
      console.log('[test] Subscribing to channel...');
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          channel.subscribe((status, error) => {
            console.log('[test] Channel subscription status:', status);
            if (status === 'SUBSCRIBED') {
              resolve();
            } else if (status === 'CLOSED' || error) {
              console.log('[test:error] Channel error:', error);
              reject(
                new Error(
                  `Channel closed or error: ${error?.message || 'unknown error'}`,
                ),
              );
            }
          });
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout subscribing to channel')),
            5000,
          ),
        ),
      ]);

      console.log('[test] Waiting before inserting test event...');
      await wait(3000);

      // Insert test event
      console.log('[test] Inserting test event...');
      await db.insert(Events).values(testEvent);
      console.log('[test] Test event inserted');

      // Wait for payload with timeout
      console.log('[test] Waiting for payload...');
      const payload = (await Promise.race([
        payloadPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout waiting for payload')),
            3000,
          ),
        ),
      ])) as RealtimePostgresInsertPayload<Tables<'events'>>;

      // Verify payload
      console.log('[test] Verifying payload...');
      expect(payload.eventType).toBe('INSERT');
      expect(payload.new).toMatchObject({
        id: testEvent.id,
        webhookId: testEvent.webhookId,
        source: testEvent.source,
        status: testEvent.status,
        userId: testEvent.userId,
        orgId: testEvent.orgId,
      });
      console.log('[test] Payload verification successful');

      // Cleanup
      console.log('[test] Starting cleanup...');
      const unsubscribeStatus = await channel.unsubscribe();
      console.log('[test] Channel unsubscribe status:', unsubscribeStatus);
      expect(unsubscribeStatus).toBe('ok');

      // Clean up test data
      console.log('[test] Cleaning up test data...');
      await db.delete(Events).where(eq(Events.id, testEvent.id));
      await db.delete(Webhooks).where(eq(Webhooks.id, webhookId));
      await db.delete(Orgs).where(eq(Orgs.id, orgId));
      await db.delete(Users).where(eq(Users.id, createdClerkUser.id));
      console.log('[test] Test data cleaned up');

      // Delete test user from Clerk
      console.log('[test] Deleting test user from Clerk...');
      await clerkClient.users.deleteUser(createdClerkUser.id);
      console.log('[test] Test completed successfully');
    },
    { timeout: 300000 },
  );
});
