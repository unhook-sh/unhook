import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';

import { trackError, trackResourceAccess } from '../analytics';

export function registerRecentRequestsResource(server: any, context: Context) {
  const caller = createCaller(context);

  server.registerResource(
    'recent-requests',
    'webhook://requests/recent',
    {
      description: 'List of recent webhook requests (last 100)',
      mimeType: 'application/json',
      title: 'Recent Webhook Requests',
    },
    async (uri: URL, extra: any) => {
      const startTime = Date.now();
      const userId = extra?.authInfo?.extra?.userId;
      const organizationId = extra?.authInfo?.extra?.organizationId;

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
