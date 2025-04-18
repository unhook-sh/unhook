import { inspect } from 'node:util';
import { db } from '@unhook/db/client';
import { Events, Requests, Tunnels } from '@unhook/db/schema';
import type {
  RequestType as BaseRequestType,
  EventType,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { count, desc, eq, sql } from 'drizzle-orm';
import { request as undiciRequest } from 'undici';
import { createStore } from 'zustand';
import { capture } from '../lib/posthog';
import { useAuthStore } from './auth-store';
import { useCliStore } from './cli-store';
import { useConnectionStore } from './connection-store';

const log = debug('unhook:cli:request-store');

// Extend RequestType to include event data
export interface RequestWithEvent extends BaseRequestType {
  event?: EventType | null;
  [key: string]: string | number | boolean | object | null | undefined; // More specific index signature
}

interface RequestState {
  requests: RequestWithEvent[];
  selectedRequestId: string | null;
  isLoading: boolean;
  totalCount: number;
}

interface RequestActions {
  setRequests: (requests: RequestWithEvent[]) => void;
  setSelectedRequestId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  initializeSelection: () => void;
  fetchRequests: (props?: {
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  handlePendingRequest: (webhookRequest: RequestWithEvent) => Promise<void>;
  replayRequest: (request: RequestWithEvent) => Promise<void>;
}

type RequestStore = RequestState & RequestActions;

const defaultRequestState: RequestState = {
  requests: [],
  selectedRequestId: null,
  isLoading: true,
  totalCount: 0,
};

const store = createStore<RequestStore>()((set, get) => ({
  ...defaultRequestState,
  setRequests: (requests) => {
    log(`Setting requests, count: ${requests.length}`);
    set({ requests });
  },
  setSelectedRequestId: (id) => {
    log(`Setting selected request ID: ${id}`);
    set({ selectedRequestId: id });
  },
  setIsLoading: (isLoading) => {
    log(`Setting loading state: ${isLoading}`);
    set({ isLoading });
  },
  initializeSelection: () => {
    const { selectedRequestId, requests } = get();
    log(
      `Initializing selection, current selected ID: ${selectedRequestId}, requests count: ${requests.length}`,
    );
    if (!selectedRequestId && requests.length > 0) {
      log(`Auto-selecting first request: ${requests[0]?.id}`);
      set({ selectedRequestId: requests[0]?.id ?? null });
    }
  },
  fetchRequests: async ({
    limit = 25,
    offset = 0,
  }: { limit?: number; offset?: number } = {}) => {
    log('Fetching requests from database', { limit, offset });
    const { tunnelId } = useCliStore.getState();
    const currentState = get();

    try {
      // Fetch requests with their associated events
      const [totalRequestCount, requests] = await Promise.all([
        db.select({ count: count() }).from(Requests),
        db.query.Requests.findMany({
          orderBy: [desc(Requests.timestamp)],
          where: eq(Requests.tunnelId, tunnelId),
          with: {
            event: true,
          },
        }),
      ]);

      log(`Fetched ${requests.length} requests`);

      // Batch all state updates together
      set({
        requests,
        selectedRequestId:
          !currentState.selectedRequestId && requests.length > 0
            ? (requests[0]?.id ?? null)
            : currentState.selectedRequestId,
        isLoading: false,
        totalCount: Number(totalRequestCount[0]?.count ?? 0),
      });
    } catch (error) {
      log('Error fetching requests:', error);
      set({ isLoading: false });
    }
  },
  handlePendingRequest: async (webhookRequest: RequestWithEvent) => {
    log(`Handling pending request: ${webhookRequest.id}`);
    const { port, redirect } = useCliStore.getState();
    const { connectionId } = useConnectionStore.getState();

    capture({
      event: 'webhook_request_received',
      properties: {
        requestId: webhookRequest.id,
        tunnelId: webhookRequest.tunnelId,
        eventId: webhookRequest.eventId,
        method: webhookRequest.request.method,
        connectionId,
        hasRedirect: !!redirect,
        port,
      },
    });

    if (webhookRequest.status === 'pending') {
      try {
        // Determine the base URL based on redirect or port
        const baseUrl = redirect || `http://localhost:${port}`;
        const url = new URL(webhookRequest.request.url, baseUrl);
        log(`Forwarding request to: ${url.toString()}`);

        // Decode base64 request body if it exists
        let requestBody: string | undefined;
        if (webhookRequest.request.body) {
          try {
            requestBody = Buffer.from(
              webhookRequest.request.body,
              'base64',
            ).toString('utf-8');
            log('Decoded request body successfully');
          } catch {
            log('Failed to decode base64 body, using raw body');
            requestBody = webhookRequest.request.body;
          }
        }

        const startTime = Date.now();
        log(
          `Sending request: method=${webhookRequest.request.method}, url=${url.toString()}, headers=${inspect(webhookRequest.request.headers)}`,
        );

        const { host, ...headers } = webhookRequest.request.headers;

        const response = await undiciRequest(url, {
          method: webhookRequest.request.method,
          headers,
          body: requestBody,
        });

        const responseText = await response.body.text();
        const responseBodyBase64 = Buffer.from(responseText).toString('base64');
        const responseTimeMs = Date.now() - startTime;

        capture({
          event: 'webhook_request_completed',
          properties: {
            requestId: webhookRequest.id,
            tunnelId: webhookRequest.tunnelId,
            eventId: webhookRequest.eventId,
            method: webhookRequest.request.method,
            responseStatus: response.statusCode,
            responseTimeMs,
            connectionId,
          },
        });

        await db
          .update(Requests)
          .set({
            status: 'completed',
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
            completedAt: new Date(),
            connectionId: connectionId ?? undefined,
          })
          .where(eq(Requests.id, webhookRequest.id));

        log('Updated request status to completed in database');

        // If this request is part of an event, update the event status
        if (webhookRequest.eventId) {
          log(`Updating associated event: ${webhookRequest.eventId}`);
          await db
            .update(Events)
            .set({
              status: 'completed',
              updatedAt: new Date(),
            })
            .where(eq(Events.id, webhookRequest.eventId));
        }

        // Update tunnel's lastRequestAt
        if (webhookRequest.tunnelId) {
          log(`Updating tunnel stats: ${webhookRequest.tunnelId}`);
          await db
            .update(Tunnels)
            .set({
              lastRequestAt: new Date(),
              requestCount: sql`${Tunnels.requestCount} + 1`,
            })
            .where(eq(Tunnels.clientId, webhookRequest.tunnelId));
        }
      } catch (error) {
        log(`Failed to forward request: ${inspect(error)}`);

        const failedReason =
          error instanceof Error
            ? error.message
            : 'Unknown error occurred while forwarding request';

        capture({
          event: 'webhook_request_failed',
          properties: {
            requestId: webhookRequest.id,
            tunnelId: webhookRequest.tunnelId,
            eventId: webhookRequest.eventId,
            method: webhookRequest.request.method,
            failedReason,
            connectionId,
          },
        });

        await db
          .update(Requests)
          .set({
            status: 'failed',
            failedReason,
            completedAt: new Date(),
            connectionId: connectionId ?? undefined,
          })
          .where(eq(Requests.id, webhookRequest.id));

        log('Updated request status to failed in database');

        // If this request is part of an event, check if we should retry or mark as failed
        if (webhookRequest.eventId) {
          log(`Checking event retry status: ${webhookRequest.eventId}`);
          const event = await db.query.Events.findFirst({
            where: eq(Events.id, webhookRequest.eventId),
          });

          if (event) {
            if (event.retryCount < event.maxRetries) {
              log(
                `Retrying event: attempt ${event.retryCount + 1}/${event.maxRetries}`,
              );
              // Update event for retry
              await db
                .update(Events)
                .set({
                  status: 'processing',
                  retryCount: event.retryCount + 1,
                  updatedAt: new Date(),
                })
                .where(eq(Events.id, event.id));

              // Create a new retry request
              await db.insert(Requests).values({
                tunnelId: webhookRequest.tunnelId,
                eventId: event.id,
                apiKey: webhookRequest.apiKey,
                userId: webhookRequest.userId,
                orgId: webhookRequest.orgId,
                request: event.originalRequest,
                status: 'pending',
                timestamp: new Date(),
              });
              log('Created new retry request for event');
            } else {
              log('Event failed: max retries reached');
              // Mark event as failed if max retries reached
              await db
                .update(Events)
                .set({
                  status: 'failed',
                  failedReason: `Max retries (${event.maxRetries}) reached. Last error: ${failedReason}`,
                  updatedAt: new Date(),
                })
                .where(eq(Events.id, event.id));
            }
          }
        }

        await get().fetchRequests();
      }
    }
  },
  replayRequest: async (request: RequestWithEvent) => {
    log(`Replaying request: ${request.id}`);
    const { user, orgId } = useAuthStore.getState();
    const { connectionId } = useConnectionStore.getState();
    const { ping: pingEnabled } = useCliStore.getState();
    capture({
      event: 'webhook_request_replay',
      properties: {
        originalRequestId: request.id,
        tunnelId: request.tunnelId,
        eventId: request.eventId,
        method: request.request.method,
        connectionId,
        pingEnabled,
        isEventRetry: !!request.eventId,
      },
    });

    if (!user?.id || !orgId) {
      log('Authentication error: missing user or org ID');
      throw new Error('User or org not authenticated');
    }

    if (!connectionId && pingEnabled !== false) {
      log('Connection error: no active connection');
      throw new Error('Connection not found');
    }

    const timestamp = request.timestamp || request.createdAt;
    log(`Using timestamp for replay: ${timestamp}`);

    // If the request is part of an event, increment its retry count
    if (request.eventId) {
      log(`Processing event for replay: ${request.eventId}`);
      const event = await db.query.Events.findFirst({
        where: eq(Events.id, request.eventId),
      });

      if (event) {
        log(`Updating event retry count: ${event.retryCount + 1}`);
        // Update event status and retry count
        await db
          .update(Events)
          .set({
            status: 'processing',
            retryCount: event.retryCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(Events.id, event.id));
      }
    }

    log('Creating new request for replay');
    // Insert the new request, maintaining the event relationship if it exists
    await db.insert(Requests).values({
      tunnelId: request.tunnelId,
      eventId: request.eventId,
      apiKey: request.apiKey,
      userId: user.id,
      orgId: orgId,
      connectionId: connectionId ?? undefined,
      request: request.request,
      status: 'pending',
      timestamp,
    });

    log('Updating tunnel request count');
    // Update tunnel's requestCount
    await db
      .update(Tunnels)
      .set({
        requestCount: sql`${Tunnels.requestCount} + 1`,
      })
      .where(eq(Tunnels.clientId, request.tunnelId));
  },
}));

export const useRequestStore = createSelectors(store);
