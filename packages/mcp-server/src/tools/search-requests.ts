import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import type { RequestType } from '@unhook/db/schema';
import { z } from 'zod';
import { trackError, trackToolUsage } from '../analytics';

export const searchRequestsSchema = {
  eventId: z.string().optional(),
  limit: z.number().default(50),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  webhookId: z.string().optional(),
};

export function registerSearchRequestsTool(
  server: McpServer,
  context: Context,
) {
  const caller = createCaller(context);

  server.registerTool(
    'search_requests',
    {
      description: 'Search webhook requests by various criteria',
      inputSchema: searchRequestsSchema,
      title: 'Search Requests',
    },
    async (args, extra) => {
      const startTime = Date.now();
      const userId = extra.authInfo?.extra?.userId as string;
      const organizationId = extra.authInfo?.extra?.organizationId as string;

      try {
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

        const limitedRequests = requests.slice(0, args.limit ?? 0);
        const summary = formatRequestsList(limitedRequests);

        const executionTime = Date.now() - startTime;

        // Track successful tool usage
        trackToolUsage(
          'search_requests',
          {
            event_id: args.eventId,
            execution_time_ms: executionTime,
            limit: args.limit,
            requests_found: limitedRequests.length,
            status: args.status,
            total_requests: requests.length,
            webhook_id: args.webhookId,
          },
          userId,
          organizationId,
        );

        return {
          content: [{ text: summary, type: 'text' }],
        };
      } catch (error) {
        // Track error
        trackError(
          error as Error,
          {
            args,
            execution_time_ms: Date.now() - startTime,
            tool_name: 'search_requests',
          },
          userId,
          organizationId,
        );

        throw error;
      }
    },
  );
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
