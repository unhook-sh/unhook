import type { WebhookConfig } from '@unhook/client/config';
import {
  createRequestsForEventToAllDestinations,
  handlePendingRequest,
} from '@unhook/client/utils/delivery';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import type { AnalyticsService } from '../services/analytics.service';
import type { AuthStore } from '../services/auth.service';

const log = debug('unhook:vscode:events-delivery-service');

export class EventsDeliveryService {
  constructor(
    private authStore: AuthStore | null,
    private analyticsService: AnalyticsService | null,
  ) {}

  /**
   * Handle delivery for new realtime events
   */
  async handleRealtimeEventDelivery(
    event: EventTypeWithRequest,
    config: WebhookConfig,
  ): Promise<void> {
    const authStore = this.authStore;
    if (!authStore || !authStore.isSignedIn) return;

    try {
      log(`Delivering realtime event ${event.id}`);

      // Check if requests already exist for this event to prevent duplicate delivery
      const existingRequests = await authStore.api.requests.byWebhookId.query({
        webhookId: event.webhookId,
      });

      const eventRequests = existingRequests.filter(
        (req) => req.eventId === event.id,
      );
      if (eventRequests.length > 0) {
        log(`Requests already exist for event ${event.id}, skipping delivery`, {
          existingRequestCount: eventRequests.length,
        });
        return;
      }

      // Create requests for all destinations
      await createRequestsForEventToAllDestinations({
        api: authStore.api,
        delivery: config.delivery,
        destination: config.destination,
        event,
        isEventRetry: false,
        onRequestCreated: async (request) => {
          log(`Created request ${request.id} for realtime event ${event.id}`);

          // Handle the pending request immediately
          await handlePendingRequest({
            api: authStore.api,
            delivery: config.delivery,
            destination: config.destination,
            event,
            request,
            requestFn: async (url, options) => {
              try {
                const response = await fetch(url, options);
                if (!response) {
                  throw new Error('No response received from fetch');
                }
                const responseText = await response.text();
                return {
                  body: { text: () => Promise.resolve(responseText) },
                  headers: Object.fromEntries(response.headers.entries()),
                  statusCode: response.status,
                };
              } catch (error) {
                log('Error in requestFn:', error);
                throw error;
              }
            },
          });

          log(`Delivered request ${request.id} for realtime event ${event.id}`);
        },
        pingEnabledFn: (destination) => !!destination.ping,
        preventDuplicates: true, // Enable duplicate prevention for realtime events
      });

      // Track successful delivery
      this.analyticsService?.trackWebhookEvent(
        event.source,
        'webhook_delivered',
        {
          auto_delivery: true,
          destination_count: config.destination?.length ?? 0,
          event_id: event.id,
          realtime: true,
        },
      );

      log(`Successfully delivered realtime event ${event.id}`);
    } catch (error) {
      log(`Failed to deliver realtime event ${event.id}:`, error);

      // Track delivery failure
      this.analyticsService?.trackWebhookEvent(
        event.source,
        'webhook_delivery_failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          event_id: event.id,
          max_retries: event.maxRetries,
          realtime: true,
          retry_count: event.retryCount,
        },
      );
    }
  }

  /**
   * Handle delivery for new events from batch updates
   */
  async handleNewEventsDelivery(
    newEvents: EventTypeWithRequest[],
    previousEvents: EventTypeWithRequest[],
    config: WebhookConfig,
  ): Promise<void> {
    const authStore = this.authStore;
    if (!authStore || !authStore.isSignedIn) return;

    const previousEventIds = previousEvents.map((e) => e.id);
    const newPendingEvents = newEvents.filter(
      (event) =>
        previousEventIds.indexOf(event.id) === -1 && event.status === 'pending',
    );

    if (newPendingEvents.length === 0) return;

    for (const event of newPendingEvents) {
      try {
        log(`Delivering event ${event.id}`);

        // Create requests for all destinations
        await createRequestsForEventToAllDestinations({
          api: authStore.api,
          delivery: config.delivery,
          destination: config.destination,
          event,
          isEventRetry: false,
          onRequestCreated: async (request) => {
            log(`Created request ${request.id} for event ${event.id}`);

            // Handle the pending request immediately
            await handlePendingRequest({
              api: authStore.api,
              delivery: config.delivery,
              destination: config.destination,
              event,
              request,
              requestFn: async (url, options) => {
                try {
                  const response = await fetch(url, options);
                  if (!response) {
                    throw new Error('No response received from fetch');
                  }
                  const responseText = await response.text();
                  return {
                    body: { text: () => Promise.resolve(responseText) },
                    headers: Object.fromEntries(response.headers.entries()),
                    statusCode: response.status,
                  };
                } catch (error) {
                  log('Error in requestFn:', error);
                  throw error;
                }
              },
            });

            log(`Delivered request ${request.id} for event ${event.id}`);
          },
          pingEnabledFn: (destination) => !!destination.ping,
        });

        // Update event status
        if (this.authStore) {
          await this.authStore.api.events.updateEventStatus.mutate({
            eventId: event.id,
            status: 'completed',
          });
        }

        // Track successful delivery
        this.analyticsService?.trackWebhookEvent(
          event.source,
          'webhook_delivered',
          {
            auto_delivery: true,
            destination_count: config.destination?.length ?? 0,
            event_id: event.id,
          },
        );

        log(`Successfully delivered event ${event.id}`);
      } catch (error) {
        log(`Failed to deliver event ${event.id}:`, error);

        // Track delivery failure
        this.analyticsService?.trackWebhookEvent(
          event.source,
          'webhook_delivery_failed',
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            event_id: event.id,
            max_retries: event.maxRetries,
            retry_count: event.retryCount,
          },
        );

        // Update event status to failed if max retries reached
        if (event.retryCount >= event.maxRetries && this.authStore) {
          await this.authStore.api.events.updateEventStatus.mutate({
            eventId: event.id,
            failedReason:
              error instanceof Error ? error.message : 'Delivery failed',
            status: 'failed',
          });
        }
      }
    }
  }
}
