import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import type { EventType } from '@unhook/db/schema';
import { z } from 'zod';

import { trackError, trackToolUsage } from '../analytics';

export const searchEventsSchema = {
  limit: z.number().default(50),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  webhookId: z.string().optional(),
};

export function registerSearchEventsTool(server: any, context: Context) {
  const caller = createCaller(context);

  server.registerTool(
    'search_events',
    {
      description: 'Search webhook events by various criteria',
      inputSchema: searchEventsSchema,
      title: 'Search Events',
    },
    async (args: z.infer<typeof searchEventsSchema>, extra: any) => {
      const startTime = Date.now();
      const userId = extra.authInfo?.extra?.userId;
      const organizationId = extra.authInfo?.extra?.organizationId;

      try {
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

        const executionTime = Date.now() - startTime;

        // Track successful tool usage
        trackToolUsage(
          'search_events',
          {
            events_found: limitedEvents.length,
            execution_time_ms: executionTime,
            limit: args.limit,
            status: args.status,
            total_events: events.length,
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
            tool_name: 'search_events',
          },
          userId,
          organizationId,
        );

        throw error;
      }
    },
  );
}

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
