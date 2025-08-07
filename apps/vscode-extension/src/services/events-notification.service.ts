import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import * as vscode from 'vscode';
import type { AnalyticsService } from './analytics.service';

export class EventsNotificationService {
  constructor(private analyticsService: AnalyticsService | null) {}

  /**
   * Check for new events and notify user if notifications are enabled
   */
  checkForNewEventsAndNotify(
    newEvents: EventTypeWithRequest[],
    previousEvents: EventTypeWithRequest[],
  ): void {
    if (previousEvents.length === 0) {
      // First time loading events, don't show notifications
      return;
    }

    const previousEventIds = previousEvents.map((e) => e.id);
    const previousEventMap: Record<string, EventTypeWithRequest> = {};
    for (const event of previousEvents) {
      previousEventMap[event.id] = event;
    }

    // Check for new events
    const newEventsOnly = newEvents.filter(
      (event) => previousEventIds.indexOf(event.id) === -1,
    );
    if (newEventsOnly.length > 0) {
      // Track new webhook events
      for (const event of newEventsOnly) {
        this.analyticsService?.trackWebhookEvent(
          event.source,
          'webhook_received',
          {
            event_id: event.id,
            has_requests: (event.requests?.length ?? 0) > 0,
            request_count: event.requests?.length ?? 0,
            status: event.status,
          },
        );
        const eventName =
          extractEventName(event.originRequest?.body) || 'Unknown';
        const source = event.source || 'Unknown';
        const message = `Webhook Event: ${eventName} from ${source}`;
        vscode.window.showInformationMessage(message);
      }
    }

    // Check for status changes in existing events
    for (const event of newEvents) {
      const previousEvent = previousEventMap[event.id];
      const eventName = extractEventName(event.originRequest?.body);

      if (previousEvent && previousEvent.status !== event.status) {
        // Track status change
        this.analyticsService?.trackWebhookEvent(
          event.source,
          'webhook_status_changed',
          {
            event_id: event.id,
            new_status: event.status,
            old_status: previousEvent.status,
          },
        );

        vscode.window.showInformationMessage(
          `Event ${eventName} status changed from ${previousEvent.status} to ${event.status}`,
        );
      }

      // Check for new requests in existing events
      if (previousEvent && event.requests && previousEvent.requests) {
        const previousRequestIds = previousEvent.requests.map((r) => r.id);
        const newRequests = event.requests.filter(
          (r) => previousRequestIds.indexOf(r.id) === -1,
        );
        if (newRequests.length > 0) {
          const message =
            newRequests.length === 1
              ? `New request for event ${eventName}: ${
                  newRequests[0]?.status || 'Unknown'
                }`
              : `${newRequests.length} new requests for event ${eventName}`;
          vscode.window.showInformationMessage(message);
        }

        // Check for request status changes
        const previousRequestMap: Record<
          string,
          EventTypeWithRequest['requests'][0]
        > = {};
        for (const request of previousEvent.requests) {
          previousRequestMap[request.id] = request;
        }
        for (const request of event.requests) {
          const previousRequest = previousRequestMap[request.id];
          if (previousRequest && previousRequest.status !== request.status) {
            vscode.window.showInformationMessage(
              `Request ${eventName} status changed from ${previousRequest.status} to ${request.status}`,
            );
          }
        }
      }
    }
  }
}
