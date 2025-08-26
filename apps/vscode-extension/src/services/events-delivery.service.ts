import type { WebhookConfig } from '@unhook/client/config';
import { createRequestsForEventToAllDestinations } from '@unhook/client/utils/delivery';
import type { EventTypeWithRequest, RequestType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import type { AnalyticsService } from './analytics.service';
import type { AuthStore } from './auth.service';

const log = debug('unhook:vscode:events-delivery-service');

export class EventsDeliveryService {
  private onRequestCreatedCallback?: (
    eventId: string,
    request: RequestType,
  ) => void;
  private onRequestStatusUpdatedCallback?: (
    eventId: string,
    requestId: string,
    status: string,
    responseTimeMs?: number,
  ) => void;

  constructor(
    private authStore: AuthStore | null,
    private analyticsService: AnalyticsService | null,
  ) {}

  /**
   * Set callback to be called when requests are created for optimistic updates
   */
  public setOnRequestCreated(
    callback: (eventId: string, request: RequestType) => void,
  ) {
    this.onRequestCreatedCallback = callback;
  }

  /**
   * Set callback to be called when request status is updated
   */
  public setOnRequestStatusUpdated(
    callback: (
      eventId: string,
      requestId: string,
      status: string,
      responseTimeMs?: number,
    ) => void,
  ) {
    this.onRequestStatusUpdatedCallback = callback;
  }

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
      // Construct webhookUrl from config and event webhookId
      const webhookUrl = config.webhookUrl;
      const existingRequests = await authStore.api.requests.byWebhookUrl.query({
        webhookUrl,
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

          // Optimistic update - notify the UI immediately
          if (this.onRequestCreatedCallback) {
            this.onRequestCreatedCallback(event.id, request);
          }

          // Handle the pending request immediately with status updates
          await this.handleRequestWithStatusUpdates(
            request,
            event,
            config,
            authStore.api,
          );

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
    log('handleNewEventsDelivery called', {
      newEventsCount: newEvents.length,
      previousEventsCount: previousEvents.length,
    });

    const authStore = this.authStore;
    if (!authStore || !authStore.isSignedIn) {
      log('Auth store not available or user not signed in, returning early');
      return;
    }

    const previousEventIds = previousEvents.map((e) => e.id);
    const newEventsToProcess = newEvents.filter(
      (event) => previousEventIds.indexOf(event.id) === -1,
    );

    log('Filtered new events to process', {
      newEventsCount: newEventsToProcess.length,
    });

    if (newEventsToProcess.length === 0) {
      log('No new events to deliver');
      return;
    }

    for (const event of newEventsToProcess) {
      try {
        log(`Delivering event ${event.id}`);

        await createRequestsForEventToAllDestinations({
          api: authStore.api,
          delivery: config.delivery,
          destination: config.destination,
          event,
          isEventRetry: false,
          onRequestCreated: async (request) => {
            log(`Created request ${request.id} for event ${event.id}`);

            // Optimistic update - notify the UI immediately
            if (this.onRequestCreatedCallback) {
              this.onRequestCreatedCallback(event.id, request);
            } else {
              log('onRequestCreatedCallback is not set');
            }

            // Handle the pending request immediately with status updates
            await this.handleRequestWithStatusUpdates(
              request,
              event,
              config,
              authStore.api,
            );

            log(`Delivered request ${request.id} for event ${event.id}`);
          },
          pingEnabledFn: (destination) => !!destination.ping,
          preventDuplicates: true, // Enable duplicate prevention for batch delivery
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

  /**
   * Handle single request replay with optimistic UI updates
   */
  public async handleSingleRequestReplay(
    request: RequestType,
    event: EventTypeWithRequest,
    config: WebhookConfig,
  ): Promise<void> {
    const authStore = this.authStore;
    if (!authStore || !authStore.isSignedIn) return;

    // Notify UI of request creation immediately
    if (this.onRequestCreatedCallback) {
      this.onRequestCreatedCallback(event.id, request);
    }

    // Handle the request with status updates
    await this.handleRequestWithStatusUpdates(
      request,
      event,
      config,
      authStore.api,
    );
  }

  /**
   * Handle request processing with status update callbacks
   */
  private async handleRequestWithStatusUpdates(
    request: RequestType,
    event: EventTypeWithRequest,
    config: WebhookConfig,
    api: AuthStore['api'],
  ): Promise<void> {
    const destination = config.destination.find(
      (d) => d.name === request.destinationName,
    );
    if (!destination) {
      log('Destination not found for request', {
        destinationName: request.destinationName,
        requestId: request.id,
      });
      return;
    }

    const originRequest = event.originRequest;
    if (!originRequest) {
      log('No origin request data available', { eventId: event.id });
      return;
    }

    if (request.status !== 'pending') {
      log('Request is not pending, skipping processing', {
        requestId: request.id,
        status: request.status,
      });
      return;
    }

    try {
      // Prepare request body
      let requestBody: string | undefined;
      if (originRequest.body) {
        try {
          requestBody = Buffer.from(originRequest.body, 'base64').toString(
            'utf-8',
          );
        } catch {
          requestBody = originRequest.body;
        }
      }

      const startTime = Date.now();
      const { host: _host, ...headers } = originRequest.headers;

      // Make the HTTP request
      const destinationUrl =
        typeof destination.url === 'string'
          ? destination.url
          : `${destination.url.protocol}://${destination.url.hostname}${destination.url.port ? `:${destination.url.port}` : ''}${destination.url.pathname || ''}${destination.url.search || ''}`;

      const response = await fetch(destinationUrl, {
        body: requestBody,
        headers,
        method: originRequest.method,
      });

      const responseText = await response.text();
      const responseBodyBase64 = Buffer.from(responseText).toString('base64');
      const responseTimeMs = Date.now() - startTime;

      // Determine if the request was successful based on response status
      const isSuccessful = response.status >= 200 && response.status < 300;
      const requestStatus = isSuccessful ? 'completed' : 'failed';

      // Update request status in database
      await api.requests.markCompleted.mutate({
        requestId: request.id,
        response: {
          body: responseBodyBase64,
          headers: Object.fromEntries(response.headers.entries()),
          status: response.status,
        },
        responseTimeMs,
      });

      // Notify UI of status update
      if (this.onRequestStatusUpdatedCallback) {
        log('Calling onRequestStatusUpdatedCallback for response', {
          eventId: event.id,
          requestId: request.id,
          responseStatus: response.status,
          responseTimeMs,
          status: requestStatus,
        });
        this.onRequestStatusUpdatedCallback(
          event.id,
          request.id,
          requestStatus,
          responseTimeMs,
        );
      } else {
        log('onRequestStatusUpdatedCallback is not set for response', {
          eventId: event.id,
          requestId: request.id,
        });
      }

      log(`Request ${requestStatus}`, {
        eventId: event.id,
        requestId: request.id,
        responseStatus: response.status,
        responseTimeMs,
      });

      // Update event status if needed
      if (typeof request.eventId === 'string') {
        await api.events.updateEventStatus.mutate({
          eventId: request.eventId,
          status: 'completed',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      log('Request failed', {
        error: errorMessage,
        eventId: event.id,
        requestId: request.id,
      });

      // Update request status to failed
      try {
        await api.requests.markCompleted.mutate({
          requestId: request.id,
          response: {
            body: Buffer.from(errorMessage).toString('base64'),
            headers: {},
            status: 0,
          },
          responseTimeMs: 0,
        });
      } catch (updateError) {
        log('Failed to update request status', { updateError });
      }

      // Notify UI of failure
      if (this.onRequestStatusUpdatedCallback) {
        log('Calling onRequestStatusUpdatedCallback for failure', {
          eventId: event.id,
          requestId: request.id,
          status: 'failed',
        });
        this.onRequestStatusUpdatedCallback(event.id, request.id, 'failed', 0);
      } else {
        log('onRequestStatusUpdatedCallback is not set for failure', {
          eventId: event.id,
          requestId: request.id,
        });
      }
    }
  }
}
