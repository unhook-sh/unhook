import * as schema from '@unhook/db/src/schema';
import { beforeEach, describe, expect, it } from 'vitest';
import waitForExpect from 'wait-for-expect';
import { TestFactories } from '../test-utils/factories';
import { testApiServer, testDb } from './setup';

describe('Events and Requests Integration Tests', () => {
  let factories: TestFactories;
  let testSetup: Awaited<
    ReturnType<TestFactories['createCompleteWebhookSetup']>
  >;

  beforeEach(async () => {
    factories = new TestFactories(testDb.db);
    testSetup = await factories.createCompleteWebhookSetup();
  });

  describe('Event Creation and Processing', () => {
    it('should create an event when webhook receives a request', async () => {
      const event = await factories.createEvent(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          status: 'pending',
          source: 'stripe',
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
        .from(schema.Events)
        .where(schema.eq(schema.Events.status, 'pending'))
        .orderBy(schema.Events.timestamp);

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
        .update(schema.Events)
        .set({ status: 'processing' })
        .where(schema.eq(schema.Events.id, event.id))
        .returning();

      expect(processing.status).toBe('processing');

      // Simulate completion
      const [completed] = await testDb.db
        .update(schema.Events)
        .set({ status: 'completed' })
        .where(schema.eq(schema.Events.id, event.id))
        .returning();

      expect(completed.status).toBe('completed');
    });

    it('should handle event failures and retries', async () => {
      const event = await factories.createEvent(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          status: 'pending',
          maxRetries: 3,
        },
      );

      // Simulate first failure
      const [firstFailure] = await testDb.db
        .update(schema.Events)
        .set({
          status: 'failed',
          retryCount: 1,
          failedReason: 'Connection timeout',
        })
        .where(schema.eq(schema.Events.id, event.id))
        .returning();

      expect(firstFailure.status).toBe('failed');
      expect(firstFailure.retryCount).toBe(1);
      expect(firstFailure.failedReason).toBe('Connection timeout');

      // Retry
      const [retry] = await testDb.db
        .update(schema.Events)
        .set({
          status: 'pending',
          retryCount: firstFailure.retryCount,
        })
        .where(schema.eq(schema.Events.id, event.id))
        .returning();

      expect(retry.status).toBe('pending');

      // Simulate max retries exceeded
      const [maxRetriesExceeded] = await testDb.db
        .update(schema.Events)
        .set({
          status: 'failed',
          retryCount: 4,
          failedReason: 'Max retries exceeded',
        })
        .where(schema.eq(schema.Events.id, event.id))
        .returning();

      expect(maxRetriesExceeded.retryCount).toBeGreaterThan(
        maxRetriesExceeded.maxRetries,
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
        id: 'req_123',
        method: 'POST',
        sourceUrl: 'https://api.stripe.com/v1/webhooks',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'v1=abc123',
          'user-agent': 'Stripe/1.0',
        },
        size: 1024,
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_123' } },
        }),
        contentType: 'application/json',
        clientIp: '192.168.1.100',
      };

      const responsePayload = {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'resp_123',
        },
        body: JSON.stringify({ received: true }),
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
          status: 'failed',
          failedReason: 'ECONNREFUSED',
          response: {
            status: 0,
            headers: {},
            body: undefined,
          },
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
        .from(schema.Requests)
        .where(schema.eq(schema.Requests.webhookId, testSetup.webhook.id));

      const webhook2Requests = await testDb.db
        .select()
        .from(schema.Requests)
        .where(schema.eq(schema.Requests.webhookId, webhook2.id));

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
        .from(schema.Requests)
        .where(schema.eq(schema.Requests.status, 'completed'));

      const failedRequests = await testDb.db
        .select()
        .from(schema.Requests)
        .where(schema.eq(schema.Requests.status, 'failed'));

      const pendingRequests = await testDb.db
        .select()
        .from(schema.Requests)
        .where(schema.eq(schema.Requests.status, 'pending'));

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
        .from(schema.Requests)
        .where(schema.gte(schema.Requests.timestamp, yesterday));

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
        .from(schema.Requests)
        .where(schema.eq(schema.Requests.eventId, event.id));

      expect(eventRequests).toHaveLength(3);
      expect(eventRequests.map((r) => r.id)).toEqual(
        expect.arrayContaining(requests.map((r) => r.id)),
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
        .from(schema.Requests)
        .where(schema.isNull(schema.Requests.eventId));

      expect(orphanedRequests).toHaveLength(1);
      expect(orphanedRequests[0].id).toBe(request.id);
    });
  });

  describe('Request Replay', () => {
    it('should replay a request', async () => {
      const originalRequest = await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          status: 'completed',
          request: {
            id: 'req_original',
            method: 'POST',
            sourceUrl: 'https://api.example.com/webhook',
            headers: { 'x-original': 'true' },
            size: 1024,
            body: JSON.stringify({ original: true }),
            contentType: 'application/json',
            clientIp: '192.168.1.1',
          },
        },
      );

      // Create a replay of the request
      const replayRequest = await factories.createRequest(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          status: 'pending',
          request: {
            ...originalRequest.request,
            id: 'req_replay',
            headers: {
              ...originalRequest.request.headers,
              'x-replay': 'true',
              'x-original-request-id': originalRequest.id,
            },
          },
          isReplay: true,
          replayOf: originalRequest.id,
        },
      );

      expect(replayRequest.request.headers['x-original-request-id']).toBe(
        originalRequest.id,
      );
      expect(replayRequest.isReplay).toBe(true);
      expect(replayRequest.replayOf).toBe(originalRequest.id);
    });
  });
});
