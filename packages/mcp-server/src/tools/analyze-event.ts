import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import type { EventType } from '@unhook/db/schema';
import { z } from 'zod/v3';

import { trackError, trackToolUsage } from '../analytics';

export const analyzeEventSchema = {
  eventId: z.string(),
};

export function registerAnalyzeEventTool(server: McpServer, context: Context) {
  const caller = createCaller(context);

  server.registerTool(
    'analyze_event',
    {
      description: 'Analyze a specific webhook event in detail',
      // biome-ignore lint/suspicious/noExplicitAny: MCP SDK requires any for schema type
      inputSchema: analyzeEventSchema as any,
      title: 'Analyze Event',
    },
    // biome-ignore lint/suspicious/noExplicitAny: MCP SDK callback signature
    async ({ eventId }: any, extra: any) => {
      const startTime = Date.now();
      const userId = extra.authInfo?.extra?.userId as string;
      const organizationId = extra.authInfo?.extra?.organizationId as string;

      try {
        const event = await caller.events.byId({ id: eventId });
        if (!event) {
          // Track not found event
          trackToolUsage(
            'analyze_event',
            {
              event_found: false,
              event_id: eventId,
              execution_time_ms: Date.now() - startTime,
            },
            userId,
            organizationId,
          );

          return {
            content: [
              { text: `Event ${eventId} not found`, type: 'text' as const },
            ],
          };
        }

        const analysis = formatEventAnalysis(event);
        const executionTime = Date.now() - startTime;

        // Track successful tool usage
        trackToolUsage(
          'analyze_event',
          {
            event_found: true,
            event_id: eventId,
            event_status: event.status,
            execution_time_ms: executionTime,
            webhook_id: event.webhookId,
          },
          userId,
          organizationId,
        );

        return {
          content: [{ text: analysis, type: 'text' as const }],
        };
      } catch (error) {
        // Track error
        trackError(
          error as Error,
          {
            event_id: eventId,
            execution_time_ms: Date.now() - startTime,
            tool_name: 'analyze_event',
          },
          userId,
          organizationId,
        );

        throw error;
      }
    },
  );
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

API Key: ${event.apiKeyId ? `***${event.apiKeyId.slice(-4)}` : 'Not provided'}`;
}
