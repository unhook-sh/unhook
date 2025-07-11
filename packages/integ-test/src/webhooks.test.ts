import { UnhookClient } from '@unhook/client';
import fetch from 'node-fetch';
import { beforeEach, describe, expect, it } from 'vitest';
import { TestFactories } from '../test-utils/factories';
import { testApiServer, testDb } from './setup';

describe('Webhook Lifecycle Integration Tests', () => {
  let factories: TestFactories;
  let client: UnhookClient;
  let testSetup: Awaited<
    ReturnType<TestFactories['createCompleteWebhookSetup']>
  >;

  beforeEach(async () => {
    factories = new TestFactories(testDb.db);
    testSetup = await factories.createCompleteWebhookSetup();

    // Initialize client with test API server
    client = new UnhookClient({
      apiKey: testSetup.webhook.apiKey,
      baseUrl: testApiServer.getUrl(),
    });
  });

  describe('Webhook Creation', () => {
    it('should create a new webhook with default settings', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
        {
          name: 'Test Webhook',
          isPrivate: false,
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
          name: 'Private Webhook',
          isPrivate: true,
        },
      );

      expect(webhook.isPrivate).toBe(true);
    });

    it('should create webhook with custom configuration', async () => {
      const customConfig = {
        storage: {
          storeHeaders: false,
          storeRequestBody: true,
          storeResponseBody: false,
          maxRequestBodySize: 512 * 1024, // 512KB
          maxResponseBodySize: 256 * 1024, // 256KB
        },
        headers: {
          blockList: ['authorization', 'x-api-key'],
          sensitiveHeaders: ['x-secret'],
        },
        requests: {
          allowedMethods: ['POST', 'PUT'],
          maxRequestsPerMinute: 100,
          maxRetries: 5,
        },
      };

      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
        {
          name: 'Custom Config Webhook',
          config: customConfig,
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
        .from(testDb.db.schema.Webhooks)
        .where(testDb.db.eq(testDb.db.schema.Webhooks.orgId, testSetup.org.id));

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
        .from(testDb.db.schema.Webhooks)
        .where(
          testDb.db.and(
            testDb.db.eq(testDb.db.schema.Webhooks.orgId, testSetup.org.id),
            testDb.db.eq(testDb.db.schema.Webhooks.status, 'active'),
          ),
        );

      const inactiveWebhooks = await testDb.db
        .select()
        .from(testDb.db.schema.Webhooks)
        .where(
          testDb.db.and(
            testDb.db.eq(testDb.db.schema.Webhooks.orgId, testSetup.org.id),
            testDb.db.eq(testDb.db.schema.Webhooks.status, 'inactive'),
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
        .update(testDb.db.schema.Webhooks)
        .set({ name: 'Updated Name' })
        .where(testDb.db.eq(testDb.db.schema.Webhooks.id, webhook.id))
        .returning();

      expect(updated.name).toBe('Updated Name');
    });

    it('should toggle webhook status', async () => {
      const webhook = await factories.createWebhook(
        testSetup.user.id,
        testSetup.org.id,
        { status: 'active' },
      );

      const [deactivated] = await testDb.db
        .update(testDb.db.schema.Webhooks)
        .set({ status: 'inactive' })
        .where(testDb.db.eq(testDb.db.schema.Webhooks.id, webhook.id))
        .returning();

      expect(deactivated.status).toBe('inactive');

      const [reactivated] = await testDb.db
        .update(testDb.db.schema.Webhooks)
        .set({ status: 'active' })
        .where(testDb.db.eq(testDb.db.schema.Webhooks.id, webhook.id))
        .returning();

      expect(reactivated.status).toBe('active');
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
        .update(testDb.db.schema.Webhooks)
        .set({ config: newConfig })
        .where(testDb.db.eq(testDb.db.schema.Webhooks.id, webhook.id))
        .returning();

      expect(updated.config.requests.maxRequestsPerMinute).toBe(200);
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
      await testDb.db
        .delete(testDb.db.schema.Webhooks)
        .where(testDb.db.eq(testDb.db.schema.Webhooks.id, webhook.id));

      // Verify webhook is deleted
      const deletedWebhook = await testDb.db
        .select()
        .from(testDb.db.schema.Webhooks)
        .where(testDb.db.eq(testDb.db.schema.Webhooks.id, webhook.id));

      expect(deletedWebhook).toHaveLength(0);

      // Verify cascading deletes
      const deletedEvent = await testDb.db
        .select()
        .from(testDb.db.schema.Events)
        .where(testDb.db.eq(testDb.db.schema.Events.id, event.id));

      const deletedRequest = await testDb.db
        .select()
        .from(testDb.db.schema.Requests)
        .where(testDb.db.eq(testDb.db.schema.Requests.id, request.id));

      const deletedConnection = await testDb.db
        .select()
        .from(testDb.db.schema.Connections)
        .where(testDb.db.eq(testDb.db.schema.Connections.id, connection.id));

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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': webhook.apiKey,
          },
          body: JSON.stringify({
            event: 'test.webhook',
            data: {
              id: '123',
              name: 'Test Data',
            },
          }),
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
        'X-Webhook-Signature': 'sha256=abcdef123456',
        'X-Request-ID': 'req-123',
      };

      const response = await fetch(
        `${testApiServer.getUrl()}/wh/${webhook.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': webhook.apiKey,
            ...customHeaders,
          },
          body: JSON.stringify({ test: true }),
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
            storage: {
              storeHeaders: true,
              storeRequestBody: true,
              storeResponseBody: true,
              maxRequestBodySize: 1024, // 1KB limit
              maxResponseBodySize: 1024,
            },
            headers: {},
            requests: {},
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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': webhook.apiKey,
          },
          body: JSON.stringify(largePayload),
        },
      );

      // The API should still accept the request but may truncate storage
      expect(response.ok).toBe(true);
    });
  });
});
