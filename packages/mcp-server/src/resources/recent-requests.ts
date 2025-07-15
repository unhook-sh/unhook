import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import { trackError, trackResourceAccess } from '../analytics';

export function registerRecentRequestsResource(
  server: McpServer,
  context: Context,
) {
  const caller = createCaller(context);

  // @ts-ignore
  server.registerResource(
    'recent-requests',
    'webhook://requests/recent',
    {
      description: 'List of recent webhook requests (last 100)',
      mimeType: 'application/json',
      title: 'Recent Webhook Requests',
    },
    async (uri: URL, extra) => {
      const startTime = Date.now();
      const userId = extra.authInfo?.extra?.userId as string;
      const organizationId = extra.authInfo?.extra?.organizationId as string;

      try {
        const requests = await caller.requests.all();
        const limitedRequests = requests.slice(0, 100);
        const executionTime = Date.now() - startTime;

        // Track resource access
        trackResourceAccess(
          'recent-requests',
          {
            execution_time_ms: executionTime,
            returned_requests: limitedRequests.length,
            total_requests: requests.length,
          },
          userId,
          organizationId,
        );

        return {
          contents: [
            {
              mimeType: 'application/json',
              text: JSON.stringify(limitedRequests, null, 2),
              uri: uri.href,
            },
          ],
        };
      } catch (error) {
        // Track error
        trackError(
          error as Error,
          {
            execution_time_ms: Date.now() - startTime,
            resource_name: 'recent-requests',
          },
          userId,
          organizationId,
        );

        throw error;
      }
    },
  );
}
