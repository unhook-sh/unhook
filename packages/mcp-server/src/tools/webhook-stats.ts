import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import type {
  EventTypeWithRequest,
  RequestType,
  WebhookType,
} from '@unhook/db/schema';
import { z } from 'zod';
import { trackError, trackToolUsage } from '../analytics';
// import type { Extra } from '../auth';

export const webhookStatsSchema = {
  webhookId: z.string(),
};

export function registerWebhookStatsTool(server: McpServer, context: Context) {
  const caller = createCaller(context);
  // @ts-expect-error
  server.registerTool(
    'get_webhook_stats',
    {
      description: 'Get statistics for a webhook',
      inputSchema: webhookStatsSchema,
      title: 'Get Webhook Stats',
    },
    async ({ webhookId }, extra) => {
      const startTime = Date.now();

      const userId = extra.authInfo?.extra?.userId as string;
      const organizationId = extra.authInfo?.extra?.organizationId as string;

      try {
        const webhook = await caller.webhooks.byId({ id: webhookId });
        if (!webhook) {
          // Track not found webhook
          trackToolUsage(
            'get_webhook_stats',
            {
              execution_time_ms: Date.now() - startTime,
              webhook_found: false,
              webhook_id: webhookId,
            },
            userId,
            organizationId,
          );

          return {
            content: [{ text: `Webhook ${webhookId} not found`, type: 'text' }],
          };
        }

        const events = await caller.events.byWebhookId({ webhookId });
        const requests = await caller.requests.byWebhookId({ webhookId });

        const stats = formatWebhookStats(webhook, events, requests);
        const executionTime = Date.now() - startTime;

        // Track successful tool usage
        trackToolUsage(
          'get_webhook_stats',
          {
            events_count: events.length,
            execution_time_ms: executionTime,
            requests_count: requests.length,
            webhook_found: true,
            webhook_id: webhookId,
            webhook_name: webhook.name,
            webhook_status: webhook.status,
          },
          userId,
          organizationId,
        );

        return {
          content: [{ text: stats, type: 'text' }],
        };
      } catch (error) {
        // Track error
        trackError(
          error as Error,
          {
            execution_time_ms: Date.now() - startTime,
            tool_name: 'get_webhook_stats',
            webhook_id: webhookId,
          },
          userId,
          organizationId,
        );

        throw error;
      }
    },
  );
}

function formatWebhookStats(
  webhook: WebhookType,
  events: EventTypeWithRequest[],
  requests: RequestType[],
): string {
  const eventStats = {
    completed: events.filter((e) => e.status === 'completed').length,
    failed: events.filter((e) => e.status === 'failed').length,
    pending: events.filter((e) => e.status === 'pending').length,
    processing: events.filter((e) => e.status === 'processing').length,
    total: events.length,
  };

  const requestStats = {
    completed: requests.filter((r) => r.status === 'completed').length,
    failed: requests.filter((r) => r.status === 'failed').length,
    pending: requests.filter((r) => r.status === 'pending').length,
    total: requests.length,
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
