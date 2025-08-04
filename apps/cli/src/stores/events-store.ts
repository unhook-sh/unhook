import {
  createRequestsForEventToAllDestinations,
  handlePendingRequest,
} from '@unhook/client/utils/delivery';
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
  }) => Promise<EventTypeWithRequest[]>;
  handlePendingRequest: ({
    request,
    event,
  }: {
    request: RequestType;
    event: EventType;
  }) => Promise<void>;
  replayEvent: (event: EventType) => Promise<void>;
  replayRequest: ({
    request,
    event,
  }: {
    request: RequestType;
    event: EventType;
  }) => Promise<void>;
  deliverEvent: (event: EventType) => Promise<void>;
  reset: () => void;
}

type EventStore = EventState & EventsActions;

const defaultEventState: EventState = {
  events: [],
  isLoading: true,
  selectedEventId: null,
  totalCount: 0,
};
const store = createStore<EventStore>()((set, get) => ({
  ...defaultEventState,
  deliverEvent: async (event: EventType) => {
    const { user, orgId } = useAuthStore.getState();
    const { connectionId } = useConnectionStore.getState();
    const { api } = useApiStore.getState();
    const { delivery, destination } = useConfigStore.getState();
    if (!user?.id || !orgId) {
      throw new Error('User or org not authenticated');
    }
    const normalizedEvent = {
      ...event,
      createdAt:
        typeof event.createdAt === 'string'
          ? new Date(event.createdAt)
          : event.createdAt,
      originRequest: event.originRequest as unknown as RequestPayload,
      timestamp:
        typeof event.timestamp === 'string'
          ? new Date(event.timestamp)
          : event.timestamp,
      updatedAt:
        event.updatedAt && typeof event.updatedAt === 'string'
          ? new Date(event.updatedAt)
          : event.updatedAt,
    } as EventType;
    await createRequestsForEventToAllDestinations({
      api,
      capture,
      connectionId,
      delivery,
      destination,
      event: normalizedEvent,
      isEventRetry: false,
      onRequestCreated: async (request) => {
        await store.getState().handlePendingRequest({ event, request });
      },
    });
  },
  fetchEvents: async ({
    limit = 25,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
  } = {}) => {
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
        isLoading: false,
        selectedEventId:
          !currentState.selectedEventId && events.length > 0
            ? (events[0]?.id ?? null)
            : currentState.selectedEventId,
        totalCount: Number(totalEventCount),
      });

      return events;
    } catch (error) {
      log('Error fetching events:', error);
      set({ isLoading: false });
      return [];
    }
  },
  handlePendingRequest: async ({
    request,
    event,
  }: {
    request: RequestType;
    event: EventType;
  }) => {
    const { delivery, destination } = useConfigStore.getState();
    const { api } = useApiStore.getState();
    await handlePendingRequest({
      api,
      capture,
      delivery,
      destination,
      event,
      request,
      requestFn: async (url, options) => {
        const { body, statusCode, headers } = await undiciRequest(url, options);
        // Remove undefined values from headers
        const filteredHeaders = Object.fromEntries(
          Object.entries(headers).filter(([, v]) => v !== undefined),
        ) as Record<string, string | string[]>;
        return { body, headers: filteredHeaders, statusCode };
      },
    });
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
  replayEvent: async (event: EventType) => {
    const { user, orgId } = useAuthStore.getState();
    const { connectionId } = useConnectionStore.getState();
    const { api } = useApiStore.getState();
    const { delivery, destination } = useConfigStore.getState();
    if (!user?.id || !orgId) {
      throw new Error('User or org not authenticated');
    }
    const normalizedEvent = {
      ...event,
      timestamp:
        typeof event.timestamp === 'string'
          ? new Date(event.timestamp)
          : event.timestamp,
    };
    if (event.retryCount && typeof event.id === 'string') {
      await api.events.updateEventStatus.mutate({
        eventId: event.id,
        retryCount: event.retryCount + 1,
        status: 'processing',
      });
    }
    await createRequestsForEventToAllDestinations({
      api,
      capture,
      connectionId,
      delivery,
      destination,
      event: normalizedEvent,
      isEventRetry: true,
      onRequestCreated: async (request) => {
        await store.getState().handlePendingRequest({ event, request });
      },
      pingEnabledFn: (destination) => !!destination.ping,
    });
  },
  replayRequest: async ({
    request,
    event,
  }: {
    request: RequestType;
    event: EventType;
  }) => {
    log(`Replaying request: ${request.id}`);
    const { user, orgId } = useAuthStore.getState();
    const { connectionId } = useConnectionStore.getState();
    const { destination } = useConfigStore.getState();

    capture({
      event: 'webhook_request_replay',
      properties: {
        connectionId,
        eventId: request.eventId,
        method: event.originRequest.method,
        originalEventId: request.eventId,
        pingEnabled: !!destination.find((t) => t.ping),
        source: request.source,
        webhookId: request.webhookId,
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
  setEvents: (events) => {
    log(`Setting events, count: ${events.length}`);
    set({ events });
  },
  setIsLoading: (isLoading) => {
    log(`Setting loading state: ${isLoading}`);
    set({ isLoading });
  },
  setSelectedEventId: (id) => {
    set({ selectedEventId: id });
  },
}));

export const useEventStore = createSelectors(store);
