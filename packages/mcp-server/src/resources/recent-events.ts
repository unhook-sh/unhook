import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import { trackError, trackResourceAccess } from '../analytics';

export function registerRecentEventsResource(
  server: McpServer,
  context: Context,
) {
  const caller = createCaller(context);

  server.registerResource(
    'recent-events',
    'webhook://events/recent',
    {
      description: 'List of recent webhook events (last 100)',
      mimeType: 'application/json',
      title: 'Recent Webhook Events',
    },
    async (uri: URL, extra) => {
      const startTime = Date.now();
      const userId = extra.authInfo?.extra?.userId as string;
      const organizationId = extra.authInfo?.extra?.organizationId as string;

      try {
        const events = await caller.events.all();
        const limitedEvents = events.slice(0, 100);
        const executionTime = Date.now() - startTime;

        // Track resource access
        trackResourceAccess(
          'recent-events',
          {
            execution_time_ms: executionTime,
            returned_events: limitedEvents.length,
            total_events: events.length,
          },
          userId,
          organizationId,
        );

        return {
          contents: [
            {
              mimeType: 'application/json',
              text: JSON.stringify(limitedEvents, null, 2),
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
            resource_name: 'recent-events',
          },
          userId,
          organizationId,
        );

        throw error;
      }
    },
  );
}
