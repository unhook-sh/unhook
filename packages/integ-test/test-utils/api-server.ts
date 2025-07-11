import { Server, createServer } from 'http';
import express, { Express } from 'express';
import { WebSocketServer } from 'ws';
import { testDb } from '../src/setup';

export class TestApiServer {
  private app: Express;
  private server: Server | null = null;
  private wss: WebSocketServer | null = null;
  private port = 0;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS for testing
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key',
      );

      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }

      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Webhook endpoints
    this.app.post('/api/webhooks', async (req, res) => {
      // Mock webhook creation
      const webhook = {
        id: `wh_${Date.now()}`,
        name: req.body.name,
        apiKey: `whsk_test_${Date.now()}`,
        status: 'active',
        isPrivate: req.body.isPrivate || false,
        createdAt: new Date().toISOString(),
      };

      res.json(webhook);
    });

    this.app.get('/api/webhooks', async (req, res) => {
      // Mock webhook listing
      res.json({
        webhooks: [],
        total: 0,
      });
    });

    this.app.get('/api/webhooks/:id', async (req, res) => {
      // Mock webhook retrieval
      res.json({
        id: req.params.id,
        name: 'Test Webhook',
        apiKey: 'whsk_test_123',
        status: 'active',
        isPrivate: false,
        createdAt: new Date().toISOString(),
      });
    });

    // Events endpoints
    this.app.get('/api/webhooks/:webhookId/events', async (req, res) => {
      res.json({
        events: [],
        total: 0,
      });
    });

    // Requests endpoints
    this.app.get('/api/webhooks/:webhookId/requests', async (req, res) => {
      res.json({
        requests: [],
        total: 0,
      });
    });

    // Webhook receiver endpoint
    this.app.all('/wh/:webhookId', async (req, res) => {
      // Mock webhook reception
      const event = {
        id: `evt_${Date.now()}`,
        webhookId: req.params.webhookId,
        method: req.method,
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString(),
      };

      // Emit to WebSocket clients
      if (this.wss) {
        this.wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            // WebSocket.OPEN
            client.send(
              JSON.stringify({
                type: 'webhook.received',
                data: event,
              }),
            );
          }
        });
      }

      res.json({ received: true, eventId: event.id });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer(this.app);

      // Setup WebSocket server
      this.wss = new WebSocketServer({ server: this.server });

      this.wss.on('connection', (ws) => {
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());

            // Handle different message types
            switch (data.type) {
              case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
              case 'subscribe':
                // Mock subscription
                ws.send(
                  JSON.stringify({
                    type: 'subscribed',
                    webhookId: data.webhookId,
                  }),
                );
                break;
            }
          } catch (error) {
            console.error('WebSocket message error:', error);
          }
        });
      });

      this.server.listen(0, () => {
        this.port = (this.server!.address() as any).port;
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close();
      }

      if (this.server) {
        this.server.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getPort(): number {
    return this.port;
  }

  getUrl(): string {
    return `http://localhost:${this.port}`;
  }

  getWsUrl(): string {
    return `ws://localhost:${this.port}`;
  }
}
