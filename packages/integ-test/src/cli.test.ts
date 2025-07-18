import fs from 'node:fs/promises';
import type { IncomingHttpHeaders, Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { execa } from 'execa';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import waitForExpect from 'wait-for-expect';
import WebSocket from 'ws';
import * as schema from '../../db/src/schema';
import { TestFactories } from '../test-utils/factories';
import { testApiServer, testDb } from './setup';

describe('CLI Integration Tests', () => {
  let factories: TestFactories;
  let testSetup: Awaited<
    ReturnType<TestFactories['createCompleteWebhookSetup']>
  >;
  let cliProcess: ReturnType<typeof execa>;
  let tempDir: string;

  beforeEach(async () => {
    factories = new TestFactories(testDb.db);
    testSetup = await factories.createCompleteWebhookSetup();

    // Create temp directory for CLI config
    tempDir = path.join(os.tmpdir(), `unhook-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up CLI process
    if (cliProcess && !cliProcess.killed) {
      cliProcess.kill('SIGTERM');
      await cliProcess.catch(() => {}); // Ignore exit errors
    }

    // Clean up temp directory
    await fs.rm(tempDir, { force: true, recursive: true });
  });

  describe('CLI Initialization', () => {
    it('should initialize CLI with API key', async () => {
      const result = await execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'init',
          '--api-key',
          testSetup.webhook.apiKeyId,
          '--api-url',
          testApiServer.getUrl(),
        ],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            UNHOOK_API_URL: testApiServer.getUrl(),
          },
        },
      );

      expect(result.exitCode).toBe(0);

      // Check if config file was created
      const configPath = path.join(tempDir, '.unhook', 'config.json');
      const configExists = await fs
        .access(configPath)
        .then(() => true)
        .catch(() => false);
      expect(configExists).toBe(true);

      // Verify config content
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      expect(config.apiKey).toBe(testSetup.webhook.apiKeyId);
      expect(config.apiUrl).toBe(testApiServer.getUrl());
    });

    it('should handle invalid API key', async () => {
      const result = await execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'init',
          '--api-key',
          'invalid-key',
          '--api-url',
          testApiServer.getUrl(),
        ],
        {
          cwd: tempDir,
          reject: false,
        },
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('invalid');
    });
  });

  describe('CLI Connection Management', () => {
    beforeEach(async () => {
      // Initialize CLI before connection tests
      await execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'init',
          '--api-key',
          testSetup.webhook.apiKeyId,
          '--api-url',
          testApiServer.getUrl(),
        ],
        {
          cwd: tempDir,
        },
      );
    });

    it('should start and connect to webhook server', async () => {
      cliProcess = execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'start',
          '--webhook-id',
          testSetup.webhook.id,
        ],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            UNHOOK_API_URL: testApiServer.getUrl(),
          },
        },
      );

      // Wait for CLI to output connection message
      await waitForExpect(async () => {
        const output = cliProcess.stdout || '';
        expect(output).toContain('Connected');
      }, 10000);

      // Verify WebSocket connection
      const ws = new WebSocket(`${testApiServer.getWsUrl()}/ws`);
      await new Promise((resolve) => ws.on('open', resolve));

      ws.send(JSON.stringify({ type: 'ping' }));

      const response = await new Promise<{ type: string }>((resolve) => {
        ws.on('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
      });

      expect(response.type).toBe('pong');
      ws.close();
    });

    it('should handle connection failures gracefully', async () => {
      // Use a non-existent server URL
      cliProcess = execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'start',
          '--webhook-id',
          testSetup.webhook.id,
          '--api-url',
          'http://localhost:99999', // Invalid port
        ],
        {
          cwd: tempDir,
          reject: false,
        },
      );

      await waitForExpect(async () => {
        const output = cliProcess.stderr || '';
        expect(output).toContain('Failed to connect');
      }, 10000);
    });

    it('should reconnect after disconnection', async () => {
      cliProcess = execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'start',
          '--webhook-id',
          testSetup.webhook.id,
        ],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            UNHOOK_API_URL: testApiServer.getUrl(),
          },
        },
      );

      // Wait for initial connection
      await waitForExpect(async () => {
        const output = cliProcess.stdout || '';
        expect(output).toContain('Connected');
      }, 10000);

      // Create connection record
      const connection = await factories.createConnection(
        testSetup.webhook.id,
        testSetup.user.id,
        testSetup.org.id,
        {
          clientId: 'test-cli-client',
        },
      );

      // Simulate disconnection
      await testDb.db
        .update(schema.Connections)
        .set({ disconnectedAt: new Date() })
        .where(eq(schema.Connections.id, connection.id));

      // Wait for reconnection
      await waitForExpect(async () => {
        const output =
          typeof cliProcess.stdout === 'string'
            ? cliProcess.stdout
            : cliProcess.stdout?.toString() || '';
        const lines = output.split('\n');
        const reconnectMessages = lines.filter((line: string) =>
          line.includes('Reconnecting'),
        );
        expect(reconnectMessages.length).toBeGreaterThan(0);
      }, 15000);
    });
  });

  describe('CLI Webhook Forwarding', () => {
    let localServer: Server;
    let localServerPort: number;
    let receivedWebhooks: {
      body: unknown;
      headers: IncomingHttpHeaders;
      timestamp: Date;
    }[] = [];

    beforeEach(async () => {
      // Initialize CLI
      await execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'init',
          '--api-key',
          testSetup.webhook.apiKeyId,
          '--api-url',
          testApiServer.getUrl(),
        ],
        {
          cwd: tempDir,
        },
      );

      // Start a local server to receive forwarded webhooks
      const app = express();
      app.use(express.json());

      receivedWebhooks = [];
      app.post('/webhook', (req, res) => {
        receivedWebhooks.push({
          body: req.body,
          headers: req.headers,
          timestamp: new Date(),
        });
        res.json({ received: true });
      });

      localServer = await new Promise<Server>((resolve) => {
        const server = app.listen(0, () => {
          const address = server.address();
          if (address && typeof address === 'object' && 'port' in address) {
            localServerPort = address.port;
          } else {
            throw new Error('Failed to get server port');
          }
          resolve(server);
        });
      });
    });

    afterEach(async () => {
      if (localServer) {
        await new Promise((resolve) => localServer.close(resolve));
      }
    });

    it('should forward webhooks to local server', async () => {
      // Start CLI with forwarding
      cliProcess = execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'start',
          '--webhook-id',
          testSetup.webhook.id,
          '--forward-to',
          `http://localhost:${localServerPort}/webhook`,
        ],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            UNHOOK_API_URL: testApiServer.getUrl(),
          },
        },
      );

      // Wait for CLI to connect
      await waitForExpect(async () => {
        const output = cliProcess.stdout || '';
        expect(output).toContain('Connected');
        expect(output).toContain(
          `Forwarding to: http://localhost:${localServerPort}/webhook`,
        );
      }, 10000);

      // Send a webhook to the API
      const response = await fetch(
        `${testApiServer.getUrl()}/wh/${testSetup.webhook.id}`,
        {
          body: JSON.stringify({
            data: { id: 'test-123' },
            event: 'test.webhook',
          }),
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': testSetup.webhook.apiKeyId,
            'X-Test-Header': 'test-value',
          },
          method: 'POST',
        },
      );

      expect(response.ok).toBe(true);

      // Wait for webhook to be forwarded
      await waitForExpect(() => {
        expect(receivedWebhooks).toHaveLength(1);
      }, 5000);

      expect(receivedWebhooks[0]?.body).toEqual({
        data: { id: 'test-123' },
        event: 'test.webhook',
      });
      expect(receivedWebhooks[0]?.headers['x-test-header']).toBe('test-value');
    });

    it('should handle forwarding failures', async () => {
      // Start CLI with invalid forward URL
      cliProcess = execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'start',
          '--webhook-id',
          testSetup.webhook.id,
          '--forward-to',
          'http://localhost:99999/webhook', // Invalid port
        ],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            UNHOOK_API_URL: testApiServer.getUrl(),
          },
        },
      );

      // Wait for CLI to connect
      await waitForExpect(async () => {
        const output = cliProcess.stdout || '';
        expect(output).toContain('Connected');
      }, 10000);

      // Send a webhook
      const response = await fetch(
        `${testApiServer.getUrl()}/wh/${testSetup.webhook.id}`,
        {
          body: JSON.stringify({ test: true }),
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': testSetup.webhook.apiKeyId,
          },
          method: 'POST',
        },
      );

      expect(response.ok).toBe(true);

      // Wait for forwarding error
      await waitForExpect(async () => {
        const output = cliProcess.stderr || '';
        expect(output).toContain('Failed to forward webhook');
      }, 10000);
    });
  });

  describe('CLI List and Status Commands', () => {
    beforeEach(async () => {
      // Initialize CLI
      await execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'init',
          '--api-key',
          testSetup.webhook.apiKeyId,
          '--api-url',
          testApiServer.getUrl(),
        ],
        {
          cwd: tempDir,
        },
      );
    });

    it('should list webhooks', async () => {
      // Create additional webhooks
      await factories.createWebhook(testSetup.user.id, testSetup.org.id, {
        name: 'CLI Test 1',
      });
      await factories.createWebhook(testSetup.user.id, testSetup.org.id, {
        name: 'CLI Test 2',
      });

      const result = await execa(
        'bun',
        ['run', path.join(__dirname, '../../cli/src/index.ts'), 'list'],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            UNHOOK_API_URL: testApiServer.getUrl(),
          },
        },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Webhooks');
    });

    it('should show webhook status', async () => {
      const result = await execa(
        'bun',
        [
          'run',
          path.join(__dirname, '../../cli/src/index.ts'),
          'status',
          '--webhook-id',
          testSetup.webhook.id,
        ],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            UNHOOK_API_URL: testApiServer.getUrl(),
          },
        },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(testSetup.webhook.id);
      expect(result.stdout).toContain('Status');
    });
  });
});
