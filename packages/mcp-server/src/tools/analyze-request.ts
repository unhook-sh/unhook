import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import type { RequestType } from '@unhook/db/schema';
import { z } from 'zod';
import { trackError, trackToolUsage } from '../analytics';

export const analyzeRequestSchema = {
  requestId: z.string(),
};

export function registerAnalyzeRequestTool(
  server: McpServer,
  context: Context,
) {
  const caller = createCaller(context);

  server.registerTool(
    'analyze_request',
    {
      description: 'Analyze a specific webhook request in detail',
      inputSchema: analyzeRequestSchema,
      title: 'Analyze Request',
    },
    async ({ requestId }, extra) => {
      const startTime = Date.now();
      const userId = extra.authInfo?.extra?.userId as string;
      const organizationId = extra.authInfo?.extra?.organizationId as string;

      try {
        const request = await caller.requests.byId({ id: requestId });
        if (!request) {
          // Track not found request
          trackToolUsage(
            'analyze_request',
            {
              execution_time_ms: Date.now() - startTime,
              request_found: false,
              request_id: requestId,
            },
            userId,
            organizationId,
          );

          return {
            content: [{ text: `Request ${requestId} not found`, type: 'text' }],
          };
        }

        const analysis = formatRequestAnalysis(request);
        const executionTime = Date.now() - startTime;

        // Track successful tool usage
        trackToolUsage(
          'analyze_request',
          {
            event_id: request.eventId,
            execution_time_ms: executionTime,
            request_found: true,
            request_id: requestId,
            request_status: request.status,
            webhook_id: request.webhookId,
          },
          userId,
          organizationId,
        );

        return {
          content: [{ text: analysis, type: 'text' }],
        };
      } catch (error) {
        // Track error
        trackError(
          error as Error,
          {
            execution_time_ms: Date.now() - startTime,
            request_id: requestId,
            tool_name: 'analyze_request',
          },
          userId,
          organizationId,
        );

        throw error;
      }
    },
  );
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
- Name: ${request.destination.name}

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
