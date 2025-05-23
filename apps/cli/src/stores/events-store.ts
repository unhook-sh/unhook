import { inspect } from 'node:util';
import type { WebhookDelivery, WebhookDestination } from '@unhook/client';
import type { Tables } from '@unhook/db';
import type {
  EventType,
  EventTypeWithRequest,
  RequestPayload,
  RequestType,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { request as undiciRequest } from 'undici';
import { createStore } from 'zustand';
import { capture } from '../lib/posthog';
import { useApiStore } from './api-store';
import { useAuthStore } from './auth-store';
import { useConfigStore } from './config-store';
import { useConnectionStore } from './connection-store';

const log = debug('unhook:cli:request-store');

interface EventState {
  events: EventTypeWithRequest[];
  selectedEventId: string | null;
  isLoading: boolean;
  totalCount: number;
}

interface EventsActions {
  setEvents: (events: EventTypeWithRequest[]) => void;
  setSelectedEventId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  initializeSelection: () => void;
  fetchEvents: (props?: {
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  handlePendingRequest: (webhookRequest: Tables<'requests'>) => Promise<void>;
  replayEvent: (event: EventType) => Promise<void>;
  replayRequest: (request: RequestType) => Promise<void>;
  deliverEvent: (event: Tables<'events'>) => Promise<void>;
  reset: () => void;
}

type EventStore = EventState & EventsActions;

const defaultEventState: EventState = {
  events: [],
  selectedEventId: null,
  isLoading: true,
  totalCount: 0,
};

type RemotePatternSchema = {
  protocol?: string;
  hostname: string;
  port?: string;
  pathname?: string;
  search?: string;
};

function getUrlString(url: string | URL | RemotePatternSchema): string {
  if (typeof url === 'string') return url;
  if (typeof URL !== 'undefined' && url instanceof URL) return url.toString();
  if (
    typeof url === 'object' &&
    url !== null &&
    'hostname' in url &&
    typeof (url as RemotePatternSchema).hostname === 'string'
  ) {
    const {
      protocol = 'http',
      hostname,
      port,
      pathname = '',
      search = '',
    } = url as RemotePatternSchema;
    return `${protocol}://${hostname}${port ? `:${port}` : ''}${pathname}${search}`;
  }
  return '';
}

function resolveDestination({
  source,
  delivery,
  destination,
}: {
  source: string;
  delivery: WebhookDelivery[];
  destination: WebhookDestination[];
}): { url: string; destination: string } | null {
  const matchingDeliver = delivery.find(
    (rule) => rule.source === '*' || rule.source === source,
  );
  if (!matchingDeliver) {
    log(`No delivery rule found for source: ${source}`);
    return null;
  }
  const destinationDef = (destination ?? []).find(
    (t) => t.name === matchingDeliver.destination,
  );
  if (!destinationDef || !destinationDef.url) {
    log(
      `No 'destination' definition found for name: ${matchingDeliver.destination}`,
    );
    return null;
  }
  const destinationUrl = getUrlString(destinationDef.url);
  return {
    url: destinationUrl,
    destination: destinationDef.name,
  };
}

// Helper to create requests for all destinations in 'to' for a given event
async function createRequestsForEventToAllDestinations({
  event,
  connectionId,
  isEventRetry = false,
  pingEnabledFn,
}: {
  event: EventType;
  connectionId?: string | null;
  isEventRetry?: boolean;
  pingEnabledFn?: (destination: WebhookDestination) => boolean;
}) {
  const { delivery, destination } = useConfigStore.getState();
  const { api } = useApiStore.getState();
  const originRequest = event.originRequest;

  for (const deliveryRule of delivery) {
    const dest = destination.find((t) => t.name === deliveryRule.destination);
    if (!dest) {
      log(
        `No destination found for delivery rule: ${deliveryRule.destination}`,
      );
      continue;
    }

    if (event.source !== deliveryRule.source) {
      log(
        `Skipping event source: ${event.source} does not match delivery rule source: ${deliveryRule.source}`,
      );
      capture({
        event: 'webhook_event_skipped',
        properties: {
          eventId: event.id,
          webhookId: event.webhookId,
          source: event.source,
          destination: dest.name,
        },
      });
      continue;
    }

    const urlString = getUrlString(dest.url);
    log(
      `Creating request for event ${event.id} to destination: ${dest.name} (${urlString})`,
    );
    capture({
      event: isEventRetry ? 'webhook_request_replay' : 'webhook_event_deliver',
      properties: {
        eventId: event.id,
        webhookId: event.webhookId,
        method: originRequest.method,
        connectionId: connectionId ?? undefined,
        pingEnabled: pingEnabledFn ? pingEnabledFn(dest) : !!dest.ping,
        isEventRetry,
        source: event.source,
        destination: dest.name,
        url: urlString,
      },
    });

    await api.requests.create.mutate({
      webhookId: event.webhookId,
      eventId: event.id,
      apiKey: event.apiKey ?? undefined,
      connectionId: connectionId ?? undefined,
      request: originRequest,
      source: event.source,
      destination: {
        name: dest.name,
        url: urlString,
      },
      timestamp:
        typeof event.timestamp === 'string'
          ? new Date(event.timestamp)
          : event.timestamp,
      status: 'pending',
      responseTimeMs: 0,
    });

    // Update webhook's requestCount
    if (typeof event.webhookId === 'string') {
      await api.webhooks.updateStats.mutate({
        webhookId: event.webhookId,
      });
    }
    log(`Created request for event ${event.id} to destination: ${dest.name}`);
  }
}

const store = createStore<EventStore>()((set, get) => ({
  ...defaultEventState,
  setEvents: (events) => {
    log(`Setting events, count: ${events.length}`);
    set({ events });
  },
  setSelectedEventId: (id) => {
    set({ selectedEventId: id });
  },
  setIsLoading: (isLoading) => {
    log(`Setting loading state: ${isLoading}`);
    set({ isLoading });
  },
  initializeSelection: () => {
    const { selectedEventId, events } = get();
    log(
      `Initializing selection, current selected ID: ${selectedEventId}, events count: ${events.length}`,
    );
    if (!selectedEventId && events.length > 0) {
      log(`Auto-selecting first event: ${events[0]?.id}`);
      set({ selectedEventId: events[0]?.id ?? null });
    }
  },
  fetchEvents: async ({
    limit = 25,
    offset = 0,
  }: { limit?: number; offset?: number } = {}) => {
    const { webhookId } = useConfigStore.getState();
    const { api } = useApiStore.getState();
    const currentState = get();
    log('Fetching events from database', { limit, offset, webhookId });

    try {
      // Fetch requests with their associated events
      const [totalEventCount, events] = await Promise.all([
        api.events.count.query({ webhookId }),
        api.events.byWebhookId.query({ webhookId }),
      ]);

      log(`Fetched ${events.length} events`);

      // Batch all state updates together
      set({
        events,
        selectedEventId:
          !currentState.selectedEventId && events.length > 0
            ? (events[0]?.id ?? null)
            : currentState.selectedEventId,
        isLoading: false,
        totalCount: Number(totalEventCount),
      });
    } catch (error) {
      log('Error fetching events:', error);
      set({ isLoading: false });
    }
  },
  handlePendingRequest: async (webhookRequest: Tables<'requests'>) => {
    log(`Handling pending event: ${webhookRequest.id}`);
    const { delivery, destination } = useConfigStore.getState();
    const { api } = useApiStore.getState();

    // Use helper to resolve rule and URL
    const dest = resolveDestination({
      source: webhookRequest.source,
      delivery,
      destination,
    });
    if (!dest) {
      log(`No destination found for source: ${webhookRequest.source}`);
      return;
    }
    const request = webhookRequest.request as unknown as RequestType['request'];

    capture({
      event: 'webhook_request_received',
      properties: {
        requestId: webhookRequest.id,
        webhookId: webhookRequest.webhookId,
        eventId: webhookRequest.eventId,
        method: (webhookRequest.request as unknown as RequestType['request'])
          ?.method,
        source: webhookRequest.source,
        destination: dest.destination,
        url: dest.url,
      },
    });

    if (webhookRequest.status === 'pending') {
      try {
        log(`Delivering request to: ${dest.url}`);

        // Decode base64 request body if it exists
        let requestBody: string | undefined;
        if (request.body) {
          try {
            requestBody = Buffer.from(request.body, 'base64').toString('utf-8');
            log('Decoded request body successfully');
          } catch {
            log('Failed to decode base64 body, using raw body');
            requestBody = request.body;
          }
        }

        const startTime = Date.now();
        log('Sending request', {
          method: request.method,
          url: dest.url,
        });

        const { host, ...headers } = request.headers;

        const response = await undiciRequest(dest.url, {
          method: request.method,
          headers,
          body: requestBody,
        });

        const responseText = await response.body.text();
        const responseBodyBase64 = Buffer.from(responseText).toString('base64');
        const responseTimeMs = Date.now() - startTime;

        log('Request completed', {
          status: response.statusCode,
          responseTimeMs,
          requestId: webhookRequest.id,
          webhookId: webhookRequest.webhookId,
          eventId: webhookRequest.eventId,
        });

        capture({
          event: 'webhook_request_completed',
          properties: {
            requestId: webhookRequest.id,
            webhookId: webhookRequest.webhookId,
            eventId: webhookRequest.eventId,
            method: request.method,
            responseStatus: response.statusCode,
            responseTimeMs,
          },
        });

        await api.events.markCompleted.mutate({
          requestId: webhookRequest.id,
          response: {
            status: response.statusCode,
            headers: Object.fromEntries(
              Object.entries(response.headers).map(([k, v]) => [
                k,
                Array.isArray(v) ? v.join(', ') : v || '',
              ]),
            ),
            body: responseBodyBase64,
          },
          responseTimeMs,
        });

        log('Updated request status to completed in database');

        // If this request is part of an event, update the event status
        if (typeof webhookRequest.eventId === 'string') {
          log(`Updating associated event: ${webhookRequest.eventId}`);
          await api.events.updateEventStatus.mutate({
            eventId: webhookRequest.eventId,
            status: 'completed',
          });
        }

        // Update webhook's lastRequestAt
        if (typeof webhookRequest.webhookId === 'string') {
          log(`Updating webhook stats: ${webhookRequest.webhookId}`);
          await api.webhooks.updateStats.mutate({
            webhookId: webhookRequest.webhookId,
            updateLastRequest: true,
          });
        }
      } catch (error) {
        log(`Failed to deliverrequest: ${inspect(error)}`);

        const failedReason =
          error instanceof Error
            ? error.message
            : 'Unknown error occurred while delivering request';

        capture({
          event: 'webhook_request_failed',
          properties: {
            requestId: webhookRequest.id,
            webhookId: webhookRequest.webhookId,
            eventId: webhookRequest.eventId,
            method: request.method,
            failedReason,
          },
        });

        await api.events.markFailed.mutate({
          requestId: webhookRequest.id,
          failedReason,
        });

        log('Updated request status to failed in database');

        // If this request is part of an event, check if we should retry or mark as failed
        if (typeof webhookRequest.eventId === 'string') {
          log(`Checking event retry status: ${webhookRequest.eventId}`);
          const event = await api.events.byId.query({
            id: webhookRequest.eventId,
          });

          if (event && typeof event.id === 'string') {
            if (event.retryCount < event.maxRetries) {
              log(
                `Retrying event: attempt ${event.retryCount + 1}/${event.maxRetries}`,
              );
              // Update event for retry
              await api.events.updateEventStatus.mutate({
                eventId: event.id,
                status: 'processing',
                retryCount: event.retryCount + 1,
              });

              // Create a new retry request
              await api.requests.create.mutate({
                webhookId: webhookRequest.webhookId,
                eventId: event.id,
                apiKey: webhookRequest.apiKey ?? undefined,
                source: event.source,
                destination: {
                  name: dest.destination,
                  url: dest.url,
                },
                request: event.originRequest,
                status: 'pending',
                timestamp: new Date(),
                responseTimeMs: 0,
              });
              log('Created new retry request for event');
            } else {
              log('Event failed: max retries reached');
              // Mark event as failed if max retries reached
              await api.events.updateEventStatus.mutate({
                eventId: event.id,
                status: 'failed',
                failedReason: `Max retries (${event.maxRetries}) reached. Last error: ${failedReason}`,
              });
            }
          }
        }

        await get().fetchEvents();
      }
    }
  },
  replayEvent: async (event: EventType) => {
    log(`Replaying event: ${event.id}`);
    const { user, orgId } = useAuthStore.getState();
    const { connectionId } = useConnectionStore.getState();
    const { api } = useApiStore.getState();
    if (!user?.id || !orgId) {
      log('Authentication error: missing user or org ID');
      throw new Error('User or org not authenticated');
    }

    // Normalize timestamp to Date
    const normalizedEvent = {
      ...event,
      timestamp:
        typeof event.timestamp === 'string'
          ? new Date(event.timestamp)
          : event.timestamp,
    };
    log(`Using timestamp for replay: ${normalizedEvent.timestamp}`);

    // If the request is part of an event, increment its retry count
    if (event.retryCount && typeof event.id === 'string') {
      log(`Processing event for replay: ${event.id}`);
      log(`Updating event retry count: ${event.retryCount + 1}`);
      // Update event status and retry count
      await api.events.updateEventStatus.mutate({
        eventId: event.id,
        status: 'processing',
        retryCount: event.retryCount + 1,
      });
    }

    log('Creating new requests for replay to all destinations');
    await createRequestsForEventToAllDestinations({
      event: normalizedEvent,
      connectionId,
      isEventRetry: true,
      pingEnabledFn: (destination) => !!destination.ping,
    });
  },
  deliverEvent: async (event: Tables<'events'>) => {
    log(`Delivering event to all destinations: ${event.id}`);
    const { user, orgId } = useAuthStore.getState();
    const { connectionId } = useConnectionStore.getState();

    if (!user?.id || !orgId) {
      log('Authentication error: missing user or org ID');
      throw new Error('User or org not authenticated');
    }

    // Normalize timestamp, createdAt, and updatedAt to Date, and cast originRequest
    const normalizedEvent = {
      ...event,
      timestamp:
        typeof event.timestamp === 'string'
          ? new Date(event.timestamp)
          : event.timestamp,
      createdAt:
        typeof event.createdAt === 'string'
          ? new Date(event.createdAt)
          : event.createdAt,
      updatedAt:
        event.updatedAt && typeof event.updatedAt === 'string'
          ? new Date(event.updatedAt)
          : event.updatedAt,
      originRequest: event.originRequest as unknown as RequestPayload,
    } as EventType;

    await createRequestsForEventToAllDestinations({
      event: normalizedEvent,
      connectionId,
      isEventRetry: false,
    });
  },
  replayRequest: async (request: RequestType) => {
    log(`Replaying request: ${request.id}`);
    const { user, orgId } = useAuthStore.getState();
    const { connectionId } = useConnectionStore.getState();
    const { destination } = useConfigStore.getState();

    capture({
      event: 'webhook_request_replay',
      properties: {
        originalEventId: request.eventId,
        webhookId: request.webhookId,
        eventId: request.eventId,
        method: request.request.method,
        connectionId,
        pingEnabled: !!destination.find((t) => t.ping),
        source: request.source,
      },
    });

    if (!user?.id || !orgId) {
      log('Authentication error: missing user or org ID');
      throw new Error('User or org not authenticated');
    }

    if (!connectionId) {
      log('Connection error: no active connection');
      throw new Error('Connection not found');
    }

    const timestamp =
      typeof request.timestamp === 'string'
        ? new Date(request.timestamp)
        : request.timestamp;
    log(`Using timestamp for replay: ${timestamp}`);

    // If the request is part of an event, increment its retry count
    // if (request.retryCount && typeof request.id === 'string') {
    log(`Processing event for replay: ${request.id}`);
    // Update event status and retry count
    // await updateEventStatusAndRetry({
    //   eventId: request.eventId,
    //   status: 'processing',
    // });
    // }

    log('Creating new request for replay');
    // await createRequestForEvent({
    //   event,
    //   userId: user.id,
    //   orgId,
    //   connectionId,
    // });
  },
  reset: () => {
    log('Resetting event store');
    set({ events: [] });
  },
}));

export const useEventStore = createSelectors(store);
