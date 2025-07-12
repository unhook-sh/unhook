import { Events, Requests } from '@unhook/db/schema';
import { eq, gte, isNull } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getTestDatabase } from '../test-utils/database';
import { TestFactories } from '../test-utils/factories';
import { testDb } from './setup';

describe('Events and Requests Integration Tests', () => {
  let factories: TestFactories;
  let testSetup: Awaited<
    ReturnType<TestFactories['createCompleteWebhookSetup']>
  >;

  beforeEach(async () => {
    // Ensure testDb is available, fallback to creating a new one if needed
    const db = testDb || (await getTestDatabase());
    factories = new TestFactories(db.db);
    testSetup = await factories.createCompleteWebhookSetup();
  });

  describe('Event Creation and Processing', () => {
    it('should create an event when webhook receives a request', async () => {
      const event = await factories.createEvent(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          source: 'stripe',
          status: 'pending',
        },
      );

      expect(event).toBeDefined();
      expect(event.webhookId).toBe(testSetup.webhook.id);
      expect(event.status).toBe('pending');
      expect(event.source).toBe('stripe');
      expect(event.retryCount).toBe(0);
      expect(event.maxRetries).toBe(3);
    });

    it('should process pending events', async () => {
      // Create multiple pending events
      const events = await Promise.all([
        factories.createEvent(
          testSetup.webhook.id,
          testSetup.user.id,
          testSetup.org.id,
          { status: 'pending' },
        ),
        factories.createEvent(
          testSetup.webhook.id,
          testSetup.user.id,
          testSetup.org.id,
          { status: 'pending' },
        ),
        factories.createEvent(
          testSetup.webhook.id,
          testSetup.user.id,
          testSetup.org.id,
          { status: 'pending' },
        ),
      ]);

      // Query pending events
      const pendingEvents = await testDb.db
        .select()
        .from(Events)
        .where(eq(Events.status, 'pending'))
        .orderBy(Events.timestamp);

      expect(pendingEvents).toHaveLength(3);
      expect(pendingEvents.map((e) => e.id)).toEqual(
        expect.arrayContaining(events.map((e) => e.id)),
      );
    });

    it('should update event status during processing', async () => {
      const event = await factories.createEvent(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { status: 'pending' },
      );

      // Simulate processing
      const [processing] = await testDb.db
        .update(Events)
        .set({ status: 'processing' })
        .where(eq(Events.id, event.id))
        .returning();

      expect(processing?.status).toBe('processing');

      // Simulate completion
      const [completed] = await testDb.db
        .update(Events)
        .set({ status: 'completed' })
        .where(eq(Events.id, event.id))
        .returning();

      expect(completed?.status).toBe('completed');
    });

    it('should handle event failures and retries', async () => {
      const event = await factories.createEvent(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          maxRetries: 3,
          status: 'pending',
        },
      );

      // Simulate first failure
      const [firstFailure] = await testDb.db
        .update(Events)
        .set({
          failedReason: 'Connection timeout',
          retryCount: 1,
          status: 'failed',
        })
        .where(eq(Events.id, event.id))
        .returning();

      expect(firstFailure?.status).toBe('failed');
      expect(firstFailure?.retryCount).toBe(1);
      expect(firstFailure?.failedReason).toBe('Connection timeout');

      // Retry
      const [retry] = await testDb.db
        .update(Events)
        .set({
          retryCount: firstFailure?.retryCount,
          status: 'pending',
        })
        .where(eq(Events.id, event.id))
        .returning();

      expect(retry?.status).toBe('pending');

      // Simulate max retries exceeded
      const [maxRetriesExceeded] = await testDb.db
        .update(Events)
        .set({
          failedReason: 'Max retries exceeded',
          retryCount: 4,
          status: 'failed',
        })
        .where(eq(Events.id, event.id))
        .returning();

      expect(maxRetriesExceeded?.retryCount).toBeGreaterThan(
        maxRetriesExceeded?.maxRetries ?? 0,
      );
    });
  });

  describe('Request Creation and Storage', () => {
    it('should create a request record for processed events', async () => {
      const event = await factories.createEvent(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
      );

      const request = await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          eventId: event.id,
          status: 'completed',
        },
      );

      expect(request).toBeDefined();
      expect(request.webhookId).toBe(testSetup.webhook.id);
      expect(request.eventId).toBe(event.id);
      expect(request.status).toBe('completed');
    });

    it('should store request and response details', async () => {
      const requestPayload = {
        body: JSON.stringify({
          data: { object: { id: 'pi_123' } },
          type: 'payment_intent.succeeded',
        }),
        clientIp: '192.168.1.100',
        contentType: 'application/json',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'v1=abc123',
          'user-agent': 'Stripe/1.0',
        },
        id: 'req_123',
        method: 'POST',
        size: 1024,
        sourceUrl: 'https://api.stripe.com/v1/webhooks',
      };

      const responsePayload = {
        body: JSON.stringify({ received: true }),
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'resp_123',
        },
        status: 200,
      };

      const request = await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          request: requestPayload,
          response: responsePayload,
          source: 'stripe',
        },
      );

      expect(request.request).toMatchObject(requestPayload);
      expect(request.response).toMatchObject(responsePayload);
      expect(request.source).toBe('stripe');
    });

    it('should handle failed requests', async () => {
      const request = await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          failedReason: 'ECONNREFUSED',
          response: {
            body: undefined,
            headers: {},
            status: 0,
          },
          status: 'failed',
        },
      );

      expect(request.status).toBe('failed');
      expect(request.failedReason).toBe('ECONNREFUSED');
      expect(request.response?.status).toBe(0);
    });
  });

  describe('Request Filtering and Querying', () => {
    it('should filter requests by webhook', async () => {
      const webhook2 = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
        { name: 'Webhook 2' },
      );

      // Create requests for different webhooks
      await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
      );
      await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
      );
      await factories.createRequest(
        webhook2.id,
        testSetup.user.id,
        testSetup.org.id,
      );

      const webhook1Requests = await testDb.db
        .select()
        .from(Requests)
        .where(eq(Requests.webhookId, testSetup.webhook.id));

      const webhook2Requests = await testDb.db
        .select()
        .from(Requests)
        .where(eq(Requests.webhookId, webhook2.id));

      expect(webhook1Requests).toHaveLength(2);
      expect(webhook2Requests).toHaveLength(1);
    });

    it('should filter requests by status', async () => {
      await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { status: 'completed' },
      );
      await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { status: 'completed' },
      );
      await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { status: 'failed' },
      );
      await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { status: 'pending' },
      );

      const completedRequests = await testDb.db
        .select()
        .from(Requests)
        .where(eq(Requests.status, 'completed'));

      const failedRequests = await testDb.db
        .select()
        .from(Requests)
        .where(eq(Requests.status, 'failed'));

      const pendingRequests = await testDb.db
        .select()
        .from(Requests)
        .where(eq(Requests.status, 'pending'));

      expect(completedRequests).toHaveLength(2);
      expect(failedRequests).toHaveLength(1);
      expect(pendingRequests).toHaveLength(1);
    });

    it('should filter requests by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { timestamp: now },
      );
      await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { timestamp: yesterday },
      );
      await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { timestamp: twoDaysAgo },
      );

      const recentRequests = await testDb.db
        .select()
        .from(Requests)
        .where(gte(Requests.timestamp, yesterday));

      expect(recentRequests).toHaveLength(2);
    });
  });

  describe('Event-Request Relationships', () => {
    it('should link multiple requests to a single event', async () => {
      const event = await factories.createEvent(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
      );

      // Create multiple requests for the same event
      const requests = await Promise.all([
        factories.createRequest(
          testSetup.webhook.id,
          testSetup.user.id,
          testSetup.org.id,
          { eventId: event.id },
        ),
        factories.createRequest(
          testSetup.webhook.id,
          testSetup.user.id,
          testSetup.org.id,
          { eventId: event.id },
        ),
        factories.createRequest(
          testSetup.webhook.id,
          testSetup.user.id,
          testSetup.org.id,
          { eventId: event.id },
        ),
      ]);

      const eventRequests = await testDb.db
        .select()
        .from(Requests)
        .where(eq(Requests.eventId, event.id));

      expect(eventRequests).toHaveLength(3);
      expect(eventRequests.map((r) => r?.id)).toEqual(
        expect.arrayContaining(requests.map((r) => r?.id)),
      );
    });

    it('should handle orphaned requests without events', async () => {
      const request = await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { eventId: null },
      );

      expect(request.eventId).toBeNull();

      const orphanedRequests = await testDb.db
        .select()
        .from(Requests)
        .where(isNull(Requests.eventId));

      expect(orphanedRequests).toHaveLength(1);
      expect(orphanedRequests[0]?.id).toBe(request.id);
    });
  });

  describe('Request Replay', () => {
    it('should replay a request', async () => {
      const originalRequest = await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          request: {
            body: JSON.stringify({ original: true }),
            clientIp: '192.168.1.1',
            contentType: 'application/json',
            headers: { 'x-original': 'true' },
            id: 'req_original',
            method: 'POST',
            size: 1024,
            sourceUrl: 'https://api.example.com/webhook',
          },
          status: 'completed',
        },
      );

      // Create a replay of the request
      const replayRequest = await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          request: {
            ...originalRequest.request,
            headers: {
              ...originalRequest.request.headers,
              'x-original-request-id': originalRequest.id,
              'x-replay': 'true',
            },
            id: 'req_replay',
          },
          status: 'pending',
        },
      );

      expect(replayRequest.request.headers['x-original-request-id']).toBe(
        originalRequest.id,
      );
      expect(replayRequest.request.headers['x-replay']).toBe('true');
    });
  });
});
