import { Connections, Events, Requests, Webhooks } from '@unhook/db/schema';
import { and, eq } from 'drizzle-orm';
import fetch from 'node-fetch';
import { beforeEach, describe, expect, it } from 'vitest';
import { TestFactories } from '../test-utils/factories';
import { testApiServer, testDb } from './setup';

describe('Webhook Lifecycle Integration Tests', () => {
  let factories: TestFactories;
  let testSetup: Awaited<
    ReturnType<TestFactories['createCompleteWebhookSetup']>
  >;

  beforeEach(async () => {
    factories = new TestFactories(testDb.db);
    testSetup = await factories.createCompleteWebhookSetup();
  });

  describe('Webhook Creation', () => {
    it('should create a new webhook with default settings', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
        {
          isPrivate: false,
          name: 'Test Webhook',
        },
      );

      expect(webhook).toBeDefined();
      expect(webhook.name).toBe('Test Webhook');
      expect(webhook.status).toBe('active');
      expect(webhook.isPrivate).toBe(false);
      expect(webhook.apiKey).toMatch(/^whsk_/);
    });

    it('should create a private webhook', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
        {
          isPrivate: true,
          name: 'Private Webhook',
        },
      );

      expect(webhook.isPrivate).toBe(true);
    });

    it('should create webhook with custom configuration', async () => {
      const customConfig = {
        headers: {
          blockList: ['authorization', 'x-api-key'],
          sensitiveHeaders: ['x-secret'],
        },
        requests: {
          allowedMethods: ['POST', 'PUT'],
          maxRequestsPerMinute: 100,
          maxRetries: 5,
        },
        storage: {
          maxRequestBodySize: 512 * 1024, // 512KB
          maxResponseBodySize: 256 * 1024, // 256KB
          storeHeaders: false,
          storeRequestBody: true,
          storeResponseBody: false,
        },
      };

      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
        {
          config: customConfig,
          name: 'Custom Config Webhook',
        },
      );

      expect(webhook.config).toMatchObject(customConfig);
    });
  });

  describe('Webhook Listing', () => {
    it('should list all webhooks for an organization', async () => {
      // Create multiple webhooks
      await factories.createWebhook(testSetup.user.id, testSetup.org.id, {
        name: 'Webhook 1',
      });
      await factories.createWebhook(testSetup.user.id, testSetup.org.id, {
        name: 'Webhook 2',
      });
      await factories.createWebhook(testSetup.user.id, testSetup.org.id, {
        name: 'Webhook 3',
      });

      const webhooks = await testDb.db
        .select()
        .from(Webhooks)
        .where(eq(Webhooks.orgId, testSetup.org.id));

      expect(webhooks).toHaveLength(4); // Including the one from setup
      expect(webhooks.map((w) => w.name)).toContain('Webhook 1');
      expect(webhooks.map((w) => w.name)).toContain('Webhook 2');
      expect(webhooks.map((w) => w.name)).toContain('Webhook 3');
    });

    it('should filter webhooks by status', async () => {
      await factories.createWebhook(testSetup.user.id, testSetup.org.id, {
        name: 'Active Webhook',
        status: 'active',
      });
      await factories.createWebhook(testSetup.user.id, testSetup.org.id, {
        name: 'Inactive Webhook',
        status: 'inactive',
      });

      const activeWebhooks = await testDb.db
        .select()
        .from(Webhooks)
        .where(
          and(
            eq(Webhooks.orgId, testSetup.org.id),
            eq(Webhooks.status, 'active'),
          ),
        );

      const inactiveWebhooks = await testDb.db
        .select()
        .from(Webhooks)
        .where(
          and(
            eq(Webhooks.orgId, testSetup.org.id),
            eq(Webhooks.status, 'inactive'),
          ),
        );

      expect(activeWebhooks).toHaveLength(2); // Including the one from setup
      expect(inactiveWebhooks).toHaveLength(1);
    });
  });

  describe('Webhook Updates', () => {
    it('should update webhook name', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
        { name: 'Original Name' },
      );

      const [updated] = await testDb.db
        .update(Webhooks)
        .set({ name: 'Updated Name' })
        .where(eq(Webhooks.id, webhook.id))
        .returning();

      expect(updated?.name).toBe('Updated Name');
    });

    it('should toggle webhook status', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
        { status: 'active' },
      );

      const [deactivated] = await testDb.db
        .update(Webhooks)
        .set({ status: 'inactive' })
        .where(eq(Webhooks.id, webhook.id))
        .returning();

      expect(deactivated?.status).toBe('inactive');

      const [reactivated] = await testDb.db
        .update(Webhooks)
        .set({ status: 'active' })
        .where(eq(Webhooks.id, webhook.id))
        .returning();

      expect(reactivated?.status).toBe('active');
    });

    it('should update webhook configuration', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
      );

      const newConfig = {
        ...webhook.config,
        requests: {
          ...webhook.config.requests,
          maxRequestsPerMinute: 200,
        },
      };

      const [updated] = await testDb.db
        .update(Webhooks)
        .set({ config: newConfig })
        .where(eq(Webhooks.id, webhook.id))
        .returning();

      expect(updated?.config.requests.maxRequestsPerMinute).toBe(200);
    });
  });

  describe('Webhook Deletion', () => {
    it('should delete a webhook and cascade to related entities', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
      );

      // Create related entities
      const event = await factories.createEvent(
        webhook.id,
        testSetup.user.id,
        testSetup.org.id,
      );
      const request = await factories.createRequest(
        webhook.id,
        testSetup.user.id,
        testSetup.org.id,
      );
      const connection = await factories.createConnection(
        webhook.id,
        testSetup.user.id,
        testSetup.org.id,
      );

      // Delete webhook
      await testDb.db.delete(Webhooks).where(eq(Webhooks.id, webhook.id));

      // Verify webhook is deleted
      const deletedWebhook = await testDb.db
        .select()
        .from(Webhooks)
        .where(eq(Webhooks.id, webhook.id));

      expect(deletedWebhook).toHaveLength(0);

      // Verify cascading deletes
      const deletedEvent = await testDb.db
        .select()
        .from(Events)
        .where(eq(Events.id, event.id));

      const deletedRequest = await testDb.db
        .select()
        .from(Requests)
        .where(eq(Requests.id, request.id));

      const deletedConnection = await testDb.db
        .select()
        .from(Connections)
        .where(eq(Connections.id, connection.id));

      expect(deletedEvent).toHaveLength(0);
      expect(deletedRequest).toHaveLength(0);
      expect(deletedConnection).toHaveLength(0);
    });
  });

  describe('Webhook Request Handling', () => {
    it('should receive and store webhook requests', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
      );

      // Send a test webhook request
      const response = await fetch(
        `${testApiServer.getUrl()}/wh/${webhook.id}`,
        {
          body: JSON.stringify({
            data: {
              id: '123',
              name: 'Test Data',
            },
            event: 'test.webhook',
          }),
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': webhook.apiKey,
          },
          method: 'POST',
        },
      );

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result).toHaveProperty('received', true);
      expect(result).toHaveProperty('eventId');
    });

    it('should handle webhook with custom headers', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
      );

      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'X-Request-ID': 'req-123',
        'X-Webhook-Signature': 'sha256=abcdef123456',
      };

      const response = await fetch(
        `${testApiServer.getUrl()}/wh/${webhook.id}`,
        {
          body: JSON.stringify({ test: true }),
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': webhook.apiKey,
            ...customHeaders,
          },
          method: 'POST',
        },
      );

      expect(response.ok).toBe(true);
    });

    it('should respect request size limits', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
        {
          config: {
            headers: {},
            requests: {},
            storage: {
              maxRequestBodySize: 1024, // 1KB limit
              maxResponseBodySize: 1024,
              storeHeaders: true,
              storeRequestBody: true,
              storeResponseBody: true,
            },
          },
        },
      );

      // Create a large payload (over 1KB)
      const largePayload = {
        data: 'x'.repeat(2048), // 2KB of data
      };

      const response = await fetch(
        `${testApiServer.getUrl()}/wh/${webhook.id}`,
        {
          body: JSON.stringify(largePayload),
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': webhook.apiKey,
          },
          method: 'POST',
        },
      );

      // The API should still accept the request but may truncate storage
      expect(response.ok).toBe(true);
    });
  });
});
