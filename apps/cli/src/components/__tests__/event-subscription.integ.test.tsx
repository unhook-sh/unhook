import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import type { Tables } from '@unhook/db';
import { db } from '@unhook/db/client';
import type { EventType } from '@unhook/db/schema';
import { Events } from '@unhook/db/schema';
import { createId } from '@unhook/id';
import {
  cleanupTestEnvironment,
  createTestWebhook,
  mockOrg,
  mockUser,
  mockWebhook,
  setupTestEnvironment,
  testLogger,
  wait,
} from './test-utils';

// Helper types
type TestEvent = EventType;
type ChannelPayload = RealtimePostgresInsertPayload<Tables<'events'>>;

// Helper functions
function createTestEvent({ webhookId }: { webhookId: string }): TestEvent {
  return {
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
    status: 'pending' as const,
    timestamp: new Date(),
    userId: mockUser.id,
    orgId: mockOrg.id,
    createdAt: new Date(),
    updatedAt: null,
    apiKey: null,
    failedReason: null,
    retryCount: 0,
    maxRetries: 3,
  };
}

async function setupChannel({
  supabase,
  filter,
}: {
  supabase: Awaited<ReturnType<typeof setupTestEnvironment>>['supabase'];
  filter?: string;
}) {
  const events: Tables<'events'>[] = [];
  const channelName = filter
    ? `test-filtered-${new Date().toISOString()}`
    : `test-${new Date().toISOString()}`;

  testLogger(
    `[test:realtime] Creating ${filter ? 'filtered ' : ''}channel: ${channelName}`,
  );

  // Verify realtime connection before proceeding
  if (!supabase.realtime.isConnected()) {
    testLogger(
      '[test:realtime] Realtime not connected, attempting to connect...',
    );
    supabase.realtime.connect();
    await wait(3000); // Wait longer for connection
  }

  testLogger('[test:realtime] Connection state:', {
    isConnected: supabase.realtime.isConnected(),
    connectionState: supabase.realtime.connectionState(),
    channels: supabase.realtime.channels,
  });

  const channel = supabase.channel(channelName);

  // Create a promise that will resolve when we receive the payload
  const payloadPromise = new Promise<ChannelPayload>((resolve) => {
    testLogger(
      `[test:realtime] Setting up listener for ${filter ? 'filtered ' : ''}channel: ${channelName}`,
    );

    // Add error handler
    // channel.on('error', undefined, (error: Error) => {
    //   testLogger('[test:realtime] Channel error:', error);
    //   reject(error);
    // });

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        ...(filter && { filter }),
      },
      (payload) => {
        testLogger(
          `[test:realtime] Received ${filter ? 'filtered ' : ''}event:`,
          {
            eventId: payload.new?.id,
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            filter: filter,
            channelState: channel.state,
            isConnected: supabase.realtime.isConnected(),
            connectionState: supabase.realtime.connectionState(),
            payload: JSON.stringify(payload, null, 2),
          },
        );
        if (payload.new) {
          events.push(payload.new as Tables<'events'>);
          resolve(payload as ChannelPayload);
        }
      },
    );
  });

  // Subscribe to the channel and wait for subscription
  await new Promise<void>((resolve, reject) => {
    testLogger(
      `[test:realtime] Subscribing to ${filter ? 'filtered ' : ''}channel: ${channelName}`,
    );
    channel.subscribe((status, error) => {
      testLogger(
        `[test:realtime] ${filter ? 'Filtered ' : ''}Channel status:`,
        {
          status,
          error: error?.message,
          channelState: channel.state,
          isConnected: supabase.realtime.isConnected(),
          connectionState: supabase.realtime.connectionState(),
        },
      );

      if (status === 'SUBSCRIBED') {
        testLogger(
          `[test:realtime] Successfully subscribed to ${filter ? 'filtered ' : ''}channel: ${channelName}`,
        );
        resolve();
      } else if (status === 'CLOSED' || error) {
        testLogger(
          `[test:realtime] ${filter ? 'Filtered ' : ''}Channel subscription failed:`,
          {
            error: error?.message || 'unknown error',
            channelState: channel.state,
            isConnected: supabase.realtime.isConnected(),
            connectionState: supabase.realtime.connectionState(),
          },
        );
        reject(
          new Error(
            `Channel closed or error: ${error?.message || 'unknown error'}`,
          ),
        );
      }
    });
  });

  await wait(3000);
  testLogger('[test:realtime] Channel state after subscription:', {
    channelState: channel.state,
    isConnected: supabase.realtime.isConnected(),
    connectionState: supabase.realtime.connectionState(),
  });

  return { channel, events, payloadPromise };
}

function verifyEventPayload(payload: ChannelPayload, expectedEvent: TestEvent) {
  expect(payload.eventType).toBe('INSERT');

  // Create copies without date fields for comparison
  const {
    createdAt: _createdAt,
    timestamp: _timestamp,
    ...expectedWithoutDates
  } = expectedEvent;
  const {
    createdAt: receivedCreatedAt,
    timestamp: receivedTimestamp,
    ...receivedWithoutDates
  } = payload.new;

  // Verify the rest of the fields match
  expect(receivedWithoutDates).toMatchObject(expectedWithoutDates);

  // Verify that the date fields exist and are valid dates
  expect(receivedCreatedAt).toBeDefined();
  expect(receivedTimestamp).toBeDefined();
  expect(new Date(receivedCreatedAt).getTime()).not.toBeNaN();
  expect(new Date(receivedTimestamp).getTime()).not.toBeNaN();
}

describe('EventSubscription Integration', () => {
  let supabase: Awaited<ReturnType<typeof setupTestEnvironment>>['supabase'];
  let createdClerkUser: Awaited<
    ReturnType<typeof setupTestEnvironment>
  >['createdClerkUser'];

  beforeAll(async () => {
    const setup = await setupTestEnvironment();
    supabase = setup.supabase;
    createdClerkUser = setup.createdClerkUser;
  });

  afterAll(async () => {
    await cleanupTestEnvironment(createdClerkUser);
  });

  it.skip(
    'should handle real-time subscription events',
    async () => {
      const { channel, payloadPromise } = await setupChannel({
        supabase,
      });
      const testEvent = createTestEvent({ webhookId: mockWebhook.id });

      try {
        testLogger(`[test:realtime] Inserting event: ${testEvent.id}`);
        await db.insert(Events).values(testEvent);
      } catch (error) {
        testLogger(
          `[test:realtime] Error inserting event: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
        throw error;
      }

      testLogger(
        '[test:realtime] Inserted event, waiting for realtime response...',
      );
      const payload = (await Promise.race([
        payloadPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout waiting for payload')),
            10000000,
          ),
        ),
      ])) as ChannelPayload;

      expect(payload).not.toBeNull();
      verifyEventPayload(payload, testEvent);

      const unsubscribeStatus = await channel.unsubscribe();
      expect(unsubscribeStatus).toBe('ok');
    },
    { timeout: 100000000 },
  );

  it(
    'should handle real-time subscription events filtered by webhook ID',
    async () => {
      const secondWebhook = await createTestWebhook();

      const { channel, events, payloadPromise } = await setupChannel({
        supabase,
        filter: `webhookId=eq.${mockWebhook.id}`,
      });

      const testEvent1 = createTestEvent({ webhookId: mockWebhook.id });
      const testEvent2 = createTestEvent({ webhookId: secondWebhook.id });

      try {
        testLogger('[test:realtime] Inserting test events...');
        await db.insert(Events).values([testEvent1, testEvent2]);
        testLogger('[test:realtime] Test events inserted successfully');
      } catch (error) {
        testLogger(
          `[test:realtime] Error inserting events: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
        throw error;
      }

      testLogger('[test:realtime] Waiting for realtime response...');
      const payload = (await Promise.race([
        payloadPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => {
              testLogger(
                '[test:realtime] Timeout waiting for payload. Current state:',
                {
                  channelState: channel.state,
                  isConnected: supabase.realtime.isConnected(),
                  connectionState: supabase.realtime.connectionState(),
                },
              );
              reject(new Error('Timeout waiting for payload'));
            },
            50000, // Reduced timeout to 5 seconds
          ),
        ),
      ])) as ChannelPayload;

      expect(payload).not.toBeNull();
      verifyEventPayload(payload, testEvent1);
      expect(payload.new.webhookId).toBe(mockWebhook.id);
      expect(payload.new.webhookId).not.toBe(secondWebhook.id);

      expect(events.length).toBe(1);

      const unsubscribeStatus = await channel.unsubscribe();
      expect(unsubscribeStatus).toBe('ok');
    },
    { timeout: 100000 }, // Reduced test timeout to 10 seconds
  );
});
