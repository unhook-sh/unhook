import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import { trackError, trackResourceAccess } from '../analytics';

export function registerWebhooksListResource(
  server: McpServer,
  context: Context,
) {
  const caller = createCaller(context);

  server.registerResource(
    'webhooks-list',
    'webhook://webhooks/list',
    {
      description: 'List of all configured webhooks',
      mimeType: 'application/json',
      title: 'Configured Webhooks',
    },
    async (uri: URL, extra) => {
      const startTime = Date.now();
      const userId = extra.authInfo?.extra?.userId as string;
      const organizationId = extra.authInfo?.extra?.organizationId as string;

      try {
        const webhooks = await caller.webhooks.all();
        const executionTime = Date.now() - startTime;

        // Track resource access
        trackResourceAccess(
          'webhooks-list',
          {
            execution_time_ms: executionTime,
            total_webhooks: webhooks.length,
          },
          userId,
          organizationId,
        );

        return {
          contents: [
            {
              mimeType: 'application/json',
              text: JSON.stringify(webhooks, null, 2),
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
            resource_name: 'webhooks-list',
          },
          userId,
          organizationId,
        );

        throw error;
      }
    },
  );
}
