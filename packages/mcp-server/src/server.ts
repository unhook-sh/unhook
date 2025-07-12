import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import type {
  EventType,
  EventTypeWithRequest,
  RequestType,
  WebhookType,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { z } from 'zod';

const log = debug('unhook:mcp-server');

export function createUnhookMCPServer(context: Context): McpServer {
  const server = new McpServer({
    name: 'unhook-mcp-server',
    version: '1.0.0',
  });

  // Create API caller
  const caller = createCaller(context);

  // Register Resources
  server.registerResource(
    'recent-events',
    'webhook://events/recent',
    {
      title: 'Recent Webhook Events',
      description: 'List of recent webhook events (last 100)',
      mimeType: 'application/json',
    },
    async (uri) => {
      const events = await caller.events.all();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(events.slice(0, 100), null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    },
  );

  server.registerResource(
    'recent-requests',
    'webhook://requests/recent',
    {
      title: 'Recent Webhook Requests',
      description: 'List of recent webhook requests (last 100)',
      mimeType: 'application/json',
    },
    async (uri) => {
      const requests = await caller.requests.all();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(requests.slice(0, 100), null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    },
  );

  server.registerResource(
    'webhooks-list',
    'webhook://webhooks/list',
    {
      title: 'Configured Webhooks',
      description: 'List of all configured webhooks',
      mimeType: 'application/json',
    },
    async (uri) => {
      const webhooks = await caller.webhooks.all();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(webhooks, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    },
  );

  // Register Tools
  server.registerTool(
    'search_events',
    {
      title: 'Search Events',
      description: 'Search webhook events by various criteria',
      inputSchema: {
        webhookId: z.string().optional(),
        status: z
          .enum(['pending', 'processing', 'completed', 'failed'])
          .optional(),
        limit: z.number().default(50),
      },
    },
    async (args) => {
      let events = await caller.events.all();

      if (args.webhookId) {
        events = events.filter(
          (e: EventType) => e.webhookId === args.webhookId,
        );
      }
      if (args.status) {
        events = events.filter((e: EventType) => e.status === args.status);
      }

      const limitedEvents = events.slice(0, args.limit);
      const summary = formatEventsList(limitedEvents);

      return {
        content: [{ type: 'text', text: summary }],
      };
    },
  );

  server.registerTool(
    'search_requests',
    {
      title: 'Search Requests',
      description: 'Search webhook requests by various criteria',
      inputSchema: {
        webhookId: z.string().optional(),
        eventId: z.string().optional(),
        status: z.enum(['pending', 'completed', 'failed']).optional(),
        limit: z.number().default(50),
      },
    },
    async (args) => {
      let requests = await caller.requests.all();

      if (args.webhookId) {
        requests = requests.filter(
          (r: RequestType) => r.webhookId === args.webhookId,
        );
      }
      if (args.eventId) {
        requests = requests.filter(
          (r: RequestType) => r.eventId === args.eventId,
        );
      }
      if (args.status) {
        requests = requests.filter(
          (r: RequestType) => r.status === args.status,
        );
      }

      const limitedRequests = requests.slice(0, args.limit);
      const summary = formatRequestsList(limitedRequests);

      return {
        content: [{ type: 'text', text: summary }],
      };
    },
  );

  server.registerTool(
    'analyze_event',
    {
      title: 'Analyze Event',
      description: 'Analyze a specific webhook event in detail',
      inputSchema: {
        eventId: z.string(),
      },
    },
    async ({ eventId }) => {
      const event = await caller.events.byId({ id: eventId });
      if (!event) {
        return {
          content: [{ type: 'text', text: `Event ${eventId} not found` }],
        };
      }

      const analysis = formatEventAnalysis(event);
      return {
        content: [{ type: 'text', text: analysis }],
      };
    },
  );

  server.registerTool(
    'analyze_request',
    {
      title: 'Analyze Request',
      description: 'Analyze a specific webhook request in detail',
      inputSchema: {
        requestId: z.string(),
      },
    },
    async ({ requestId }) => {
      const request = await caller.requests.byId({ id: requestId });
      if (!request) {
        return {
          content: [{ type: 'text', text: `Request ${requestId} not found` }],
        };
      }

      const analysis = formatRequestAnalysis(request);
      return {
        content: [{ type: 'text', text: analysis }],
      };
    },
  );

  server.registerTool(
    'get_webhook_stats',
    {
      title: 'Get Webhook Stats',
      description: 'Get statistics for a webhook',
      inputSchema: {
        webhookId: z.string(),
      },
    },
    async ({ webhookId }) => {
      const webhook = await caller.webhooks.byId({ id: webhookId });
      if (!webhook) {
        return {
          content: [{ type: 'text', text: `Webhook ${webhookId} not found` }],
        };
      }

      const events = await caller.events.byWebhookId({ webhookId });
      const requests = await caller.requests.byWebhookId({ webhookId });

      const stats = formatWebhookStats(webhook, events, requests);
      return {
        content: [{ type: 'text', text: stats }],
      };
    },
  );

  // Register Prompts
  server.registerPrompt(
    'debug_webhook_issue',
    {
      title: 'Debug Webhook Issue',
      description: 'Debug a webhook issue step by step',
      argsSchema: {
        webhookId: z.string(),
        timeframe: z.string().default('last 24 hours'),
      },
    },
    ({ webhookId, timeframe }) => ({
      messages: [
        {
          role: 'system',
          content: {
            type: 'text',
            text: 'You are a webhook debugging assistant. Analyze the webhook data and help identify issues.',
          },
        },
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me debug webhook ${webhookId} for the ${timeframe}. 
          
Start by:
1. Getting the webhook statistics
2. Searching for recent events and their status
3. Looking for failed requests and analyzing their errors
4. Providing recommendations for fixing any issues found`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'analyze_failures',
    {
      title: 'Analyze Failures',
      description: 'Analyze webhook failures and suggest fixes',
      argsSchema: {
        webhookId: z.string().optional(),
      },
    },
    ({ webhookId }) => ({
      messages: [
        {
          role: 'system',
          content: {
            type: 'text',
            text: 'You are a webhook failure analysis expert. Identify patterns in failures and suggest solutions.',
          },
        },
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze webhook failures${
              webhookId ? ` for webhook ${webhookId}` : ' across all webhooks'
            }. 

Focus on:
1. Finding all failed events and requests
2. Identifying common failure patterns
3. Analyzing error messages and response codes
4. Suggesting specific fixes for each type of failure
5. Recommending configuration changes to prevent future failures`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'performance_report',
    {
      title: 'Performance Report',
      description: 'Generate a performance report for webhooks',
      argsSchema: {
        webhookId: z.string().optional(),
      },
    },
    ({ webhookId }) => ({
      messages: [
        {
          role: 'system',
          content: {
            type: 'text',
            text: 'You are a webhook performance analyst. Generate comprehensive performance reports.',
          },
        },
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Generate a performance report${
              webhookId ? ` for webhook ${webhookId}` : ' for all webhooks'
            }. 

Include:
1. Overall statistics (total requests, success rate, etc.)
2. Response time analysis (average, min, max, percentiles)
3. Error rate trends
4. Peak usage times
5. Performance recommendations
6. Comparison with best practices`,
          },
        },
      ],
    }),
  );

  return server;
}

// Helper functions
function formatEventsList(events: EventType[]): string {
  if (events.length === 0) {
    return 'No events found matching the criteria.';
  }

  const summary = events
    .map(
      (e) =>
        `Event ${e.id}:
  - Webhook: ${e.webhookId}
  - Status: ${e.status}
  - Timestamp: ${e.timestamp}
  - Retry Count: ${e.retryCount}/${e.maxRetries}
  ${e.failedReason ? `- Failed Reason: ${e.failedReason}` : ''}`,
    )
    .join('\n\n');

  return `Found ${events.length} events:\n\n${summary}`;
}

function formatRequestsList(requests: RequestType[]): string {
  if (requests.length === 0) {
    return 'No requests found matching the criteria.';
  }

  const summary = requests
    .map(
      (r) =>
        `Request ${r.id}:
  - Webhook: ${r.webhookId}
  - Event: ${r.eventId || 'N/A'}
  - Status: ${r.status}
  - Method: ${r.request.method}
  - URL: ${r.request.sourceUrl}
  - Response Time: ${r.responseTimeMs || 'N/A'}ms
  ${r.failedReason ? `- Failed Reason: ${r.failedReason}` : ''}`,
    )
    .join('\n\n');

  return `Found ${requests.length} requests:\n\n${summary}`;
}

function formatEventAnalysis(event: EventType): string {
  return `Event Analysis for ${event.id}:

Basic Information:
- Webhook ID: ${event.webhookId}
- Status: ${event.status}
- Created: ${event.createdAt}
- Last Updated: ${event.updatedAt || 'N/A'}

Request Details:
- Method: ${event.originRequest.method}
- URL: ${event.originRequest.sourceUrl}
- Content Type: ${event.originRequest.contentType}
- Size: ${event.originRequest.size} bytes
- Client IP: ${event.originRequest.clientIp}

Headers:
${JSON.stringify(event.originRequest.headers, null, 2)}

${
  event.originRequest.body
    ? `Body:\n${event.originRequest.body}`
    : 'Body: (empty)'
}

Retry Information:
- Current Attempts: ${event.retryCount}
- Max Retries: ${event.maxRetries}
${event.failedReason ? `- Failed Reason: ${event.failedReason}` : ''}

API Key: ${event.apiKey ? `***${event.apiKey.slice(-4)}` : 'Not provided'}`;
}

function formatRequestAnalysis(request: RequestType): string {
  return `Request Analysis for ${request.id}:

Basic Information:
- Webhook ID: ${request.webhookId}
- Event ID: ${request.eventId || 'N/A'}
- Status: ${request.status}
- Created: ${request.createdAt}
- Completed: ${request.completedAt || 'N/A'}

Request Details:
- Method: ${request.request.method}
- URL: ${request.request.sourceUrl}
- Content Type: ${request.request.contentType}
- Size: ${request.request.size} bytes
- Client IP: ${request.request.clientIp}

Request Headers:
${JSON.stringify(request.request.headers, null, 2)}

${
  request.request.body
    ? `Request Body:\n${request.request.body}`
    : 'Request Body: (empty)'
}

Destination:
- URL: ${request.destination.url}
- Timeout: ${request.destination.timeout}ms

${
  request.response
    ? `Response:
- Status: ${request.response.status}
- Headers: ${JSON.stringify(request.response.headers, null, 2)}
- Body: ${request.response.body || '(empty)'}
- Time: ${request.responseTimeMs}ms`
    : 'Response: Not received'
}

${request.failedReason ? `Failed Reason: ${request.failedReason}` : ''}`;
}

function formatWebhookStats(
  webhook: WebhookType,
  events: EventTypeWithRequest[],
  requests: RequestType[],
): string {
  const eventStats = {
    total: events.length,
    pending: events.filter((e) => e.status === 'pending').length,
    processing: events.filter((e) => e.status === 'processing').length,
    completed: events.filter((e) => e.status === 'completed').length,
    failed: events.filter((e) => e.status === 'failed').length,
  };

  const requestStats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    failed: requests.filter((r) => r.status === 'failed').length,
  };

  const avgResponseTime =
    requests
      .filter((r) => r.responseTimeMs)
      .reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) /
      requests.filter((r) => r.responseTimeMs).length || 0;

  return `Webhook Statistics for ${webhook.name} (${webhook.id}):

Webhook Information:
- Status: ${webhook.status}
- Created: ${webhook.createdAt}
- Total Requests: ${webhook.requestCount}

Event Statistics:
- Total Events: ${eventStats.total}
- Pending: ${eventStats.pending}
- Processing: ${eventStats.processing}
- Completed: ${eventStats.completed}
- Failed: ${eventStats.failed}

Request Statistics:
- Total Requests: ${requestStats.total}
- Pending: ${requestStats.pending}
- Completed: ${requestStats.completed}
- Failed: ${requestStats.failed}
- Average Response Time: ${avgResponseTime.toFixed(2)}ms

Configuration:
- Store Headers: ${webhook.config.storage.storeHeaders}
- Store Request Body: ${webhook.config.storage.storeRequestBody}
- Store Response Body: ${webhook.config.storage.storeResponseBody}
- Max Request Body Size: ${webhook.config.storage.maxRequestBodySize} bytes
- Max Response Body Size: ${webhook.config.storage.maxResponseBodySize} bytes`;
}
