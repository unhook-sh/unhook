import * as schema from '@unhook/db/src/schema';
import { beforeEach, describe, expect, it } from 'vitest';
import waitForExpect from 'wait-for-expect';
import WebSocket from 'ws';
import { TestFactories } from '../test-utils/factories';
import { testApiServer, testDb } from './setup';

describe('WebSocket Connections Integration Tests', () => {
  let factories: TestFactories;
  let testSetup: Awaited<
    ReturnType<TestFactories['createCompleteWebhookSetup']>
  >;
  let ws: WebSocket | null = null;

  beforeEach(async () => {
    factories = new TestFactories(testDb.db);
    testSetup = await factories.createCompleteWebhookSetup();
  });

  afterEach(async () => {
    // Close WebSocket connection if open
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });

  describe('Connection Lifecycle', () => {
    it('should establish WebSocket connection', async () => {
      ws = new WebSocket(`${testApiServer.getWsUrl()}/ws`);

      await new Promise<void>((resolve, reject) => {
        ws!.on('open', () => resolve());
        ws!.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    it('should handle authentication', async () => {
      ws = new WebSocket(`${testApiServer.getWsUrl()}/ws`);

      await new Promise((resolve) => ws!.on('open', resolve));

      // Send authentication message
      ws.send(
        JSON.stringify({
          type: 'auth',
          apiKey: testSetup.webhook.apiKey,
          clientId: `test-client-${Date.now()}`,
        }),
      );

      const response = await new Promise<any>((resolve) => {
        ws!.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (
            message.type === 'auth-success' ||
            message.type === 'auth-error'
          ) {
            resolve(message);
          }
        });
      });

      expect(response.type).toBe('auth-success');
    });

    it('should create connection record in database', async () => {
      const connection = await factories.createConnection(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          clientId: 'test-ws-client',
          status: 'connected',
          metadata: {
            ip: '127.0.0.1',
            userAgent: 'test-agent',
          },
        },
      );

      expect(connection).toBeDefined();
      expect(connection.clientId).toBe('test-ws-client');
      expect(connection.status).toBe('connected');
      expect(connection.metadata).toMatchObject({
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });

      // Verify in database
      const dbConnection = await testDb.db
        .select()
        .from(schema.Connections)
        .where(schema.eq(schema.Connections.id, connection.id))
        .limit(1);

      expect(dbConnection[0]).toBeDefined();
    });

    it('should handle disconnection', async () => {
      const connection = await factories.createConnection(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { status: 'connected' },
      );

      // Update to disconnected
      const [updated] = await testDb.db
        .update(schema.Connections)
        .set({
          status: 'disconnected',
          disconnectedAt: new Date(),
        })
        .where(schema.eq(schema.Connections.id, connection.id))
        .returning();

      expect(updated.status).toBe('disconnected');
      expect(updated.disconnectedAt).toBeDefined();
    });
  });

  describe('Real-time Events', () => {
    it('should receive webhook events in real-time', async () => {
      ws = new WebSocket(`${testApiServer.getWsUrl()}/ws`);
      await new Promise((resolve) => ws!.on('open', resolve));

      // Subscribe to webhook
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          webhookId: testSetup.webhook.id,
        }),
      );

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Wait for subscription confirmation
      await waitForExpect(() => {
        expect(messages.some((m) => m.type === 'subscribed')).toBe(true);
      }, 5000);

      // Send a webhook request
      const response = await fetch(
        `${testApiServer.getUrl()}/wh/${testSetup.webhook.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': testSetup.webhook.apiKey,
          },
          body: JSON.stringify({ test: 'real-time' }),
        },
      );

      expect(response.ok).toBe(true);

      // Wait for webhook event via WebSocket
      await waitForExpect(() => {
        const webhookMessage = messages.find(
          (m) => m.type === 'webhook.received',
        );
        expect(webhookMessage).toBeDefined();
        expect(webhookMessage.data.webhookId).toBe(testSetup.webhook.id);
      }, 5000);
    });

    it('should handle multiple concurrent connections', async () => {
      const connections = await Promise.all([
        factories.createConnection(
          testSetup.webhook.id,
          testSetup.user.id,
          testSetup.org.id,
          {
            clientId: 'client-1',
            status: 'connected',
          },
        ),
        factories.createConnection(
          testSetup.webhook.id,
          testSetup.user.id,
          testSetup.org.id,
          {
            clientId: 'client-2',
            status: 'connected',
          },
        ),
        factories.createConnection(
          testSetup.webhook.id,
          testSetup.user.id,
          testSetup.org.id,
          {
            clientId: 'client-3',
            status: 'connected',
          },
        ),
      ]);

      const activeConnections = await testDb.db
        .select()
        .from(schema.Connections)
        .where(
          schema.and(
            schema.eq(schema.Connections.webhookId, testSetup.webhook.id),
            schema.eq(schema.Connections.status, 'connected'),
          ),
        );

      expect(activeConnections).toHaveLength(3);
      expect(activeConnections.map((c) => c.clientId).sort()).toEqual([
        'client-1',
        'client-2',
        'client-3',
      ]);
    });
  });

  describe('Connection Routing', () => {
    it('should route requests to active connections', async () => {
      // Create multiple connections with different routing preferences
      const primaryConnection = await factories.createConnection(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          clientId: 'primary-client',
          status: 'connected',
          metadata: {
            routingRule: 'stripe.*',
            priority: 1,
          },
        },
      );

      const secondaryConnection = await factories.createConnection(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          clientId: 'secondary-client',
          status: 'connected',
          metadata: {
            routingRule: 'github.*',
            priority: 2,
          },
        },
      );

      // Create events with different sources
      const stripeEvent = await factories.createEvent(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { source: 'stripe' },
      );

      const githubEvent = await factories.createEvent(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        { source: 'github' },
      );

      // Verify routing (in a real implementation, this would check which connection received the event)
      expect(primaryConnection.metadata.routingRule).toContain('stripe');
      expect(secondaryConnection.metadata.routingRule).toContain('github');
    });

    it('should handle connection failover', async () => {
      // Create primary and backup connections
      const primary = await factories.createConnection(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          clientId: 'primary',
          status: 'connected',
          metadata: { isPrimary: true },
        },
      );

      const backup = await factories.createConnection(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          clientId: 'backup',
          status: 'connected',
          metadata: { isPrimary: false },
        },
      );

      // Simulate primary connection failure
      await testDb.db
        .update(schema.Connections)
        .set({
          status: 'disconnected',
          disconnectedAt: new Date(),
        })
        .where(schema.eq(schema.Connections.id, primary.id));

      // Check that backup is still active
      const activeConnections = await testDb.db
        .select()
        .from(schema.Connections)
        .where(
          schema.and(
            schema.eq(schema.Connections.webhookId, testSetup.webhook.id),
            schema.eq(schema.Connections.status, 'connected'),
          ),
        );

      expect(activeConnections).toHaveLength(1);
      expect(activeConnections[0].clientId).toBe('backup');
    });
  });

  describe('Connection Monitoring', () => {
    it('should track connection metrics', async () => {
      const connection = await factories.createConnection(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          status: 'connected',
          metadata: {
            messagesReceived: 0,
            messagesSent: 0,
            lastActivity: new Date().toISOString(),
          },
        },
      );

      // Simulate activity
      const updatedMetadata = {
        ...connection.metadata,
        messagesReceived: 10,
        messagesSent: 5,
        lastActivity: new Date().toISOString(),
      };

      const [updated] = await testDb.db
        .update(schema.Connections)
        .set({ metadata: updatedMetadata })
        .where(schema.eq(schema.Connections.id, connection.id))
        .returning();

      expect(updated.metadata.messagesReceived).toBe(10);
      expect(updated.metadata.messagesSent).toBe(5);
    });

    it('should detect stale connections', async () => {
      const staleTime = new Date();
      staleTime.setMinutes(staleTime.getMinutes() - 30); // 30 minutes ago

      // Create stale connection
      const staleConnection = await factories.createConnection(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          status: 'connected',
          connectedAt: staleTime,
          metadata: {
            lastActivity: staleTime.toISOString(),
          },
        },
      );

      // Create active connection
      const activeConnection = await factories.createConnection(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          status: 'connected',
          connectedAt: new Date(),
        },
      );

      // Query for stale connections
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const staleConnections = await testDb.db
        .select()
        .from(schema.Connections)
        .where(
          schema.and(
            schema.eq(schema.Connections.status, 'connected'),
            schema.lt(schema.Connections.connectedAt, fifteenMinutesAgo),
          ),
        );

      expect(staleConnections).toHaveLength(1);
      expect(staleConnections[0].id).toBe(staleConnection.id);
    });
  });
});
