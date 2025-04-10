import { db } from '@unhook/db/client';
import { Events, Requests, Tunnels } from '@unhook/db/schema';
import type {
  RequestType as BaseRequestType,
  EventType,
} from '@unhook/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { request as undiciRequest } from 'undici';
import { createStore } from 'zustand';
import { debug } from '~/log';
import { useAuthStore } from './auth/store';
import { useCliStore } from './cli-store';
import { useConnectionStore } from './connection-store';
import { createSelectors } from './zustand-create-selectors';

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
}

interface RequestActions {
  setRequests: (requests: RequestWithEvent[]) => void;
  setSelectedRequestId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  initializeSelection: () => void;
  fetchRequests: () => Promise<void>;
  handlePendingRequest: (webhookRequest: RequestWithEvent) => Promise<void>;
  replayRequest: (request: RequestWithEvent) => Promise<void>;
}

type RequestStore = RequestState & RequestActions;

const defaultRequestState: RequestState = {
  requests: [],
  selectedRequestId: null,
  isLoading: true,
};

const store = createStore<RequestStore>()((set, get) => ({
  ...defaultRequestState,
  setRequests: (requests) => {
    set({ requests });
  },
  setSelectedRequestId: (id) => set({ selectedRequestId: id }),
  setIsLoading: (isLoading) => set({ isLoading }),
  initializeSelection: () => {
    const { selectedRequestId, requests } = get();
    if (!selectedRequestId && requests.length > 0) {
      set({ selectedRequestId: requests[0]?.id ?? null });
    }
  },
  fetchRequests: async () => {
    // Fetch requests with their associated events
    const requests = await db.query.Requests.findMany({
      orderBy: [desc(Requests.createdAt)],
      with: {
        event: true,
      },
    });

    set((state) => {
      const selectedRequestId =
        !state.selectedRequestId && requests.length > 0
          ? (requests[0]?.id ?? null)
          : state.selectedRequestId;

      return {
        requests,
        selectedRequestId,
        isLoading: false,
      };
    });
  },
  handlePendingRequest: async (webhookRequest: RequestWithEvent) => {
    const { port, redirect } = useCliStore.getState();
    const { connectionId } = useConnectionStore.getState();

    if (webhookRequest.status === 'pending') {
      try {
        // Determine the base URL based on redirect or port
        const baseUrl = redirect || `http://localhost:${port}`;
        // Ensure we don't double up on slashes when joining URLs
        const url = new URL(webhookRequest.request.url, baseUrl);

        // Decode base64 request body if it exists
        let requestBody: string | undefined;
        if (webhookRequest.request.body) {
          try {
            requestBody = Buffer.from(
              webhookRequest.request.body,
              'base64',
            ).toString('utf-8');
          } catch {
            requestBody = webhookRequest.request.body;
          }
        }

        const startTime = Date.now();
        log(
          'Sending request to',
          url.toString(),
          webhookRequest.request.method,
          requestBody,
          JSON.stringify(webhookRequest.request.headers),
        );

        const { host, ...headers } = webhookRequest.request.headers;

        const response = await undiciRequest(url, {
          method: webhookRequest.request.method,
          headers,
          body: requestBody,
          // @ts-ignore - Undici types don't properly expose these options
          // dispatcher: {
          // tls: {
          // rejectUnauthorized: false,
          // },
          // },
        });

        // Get response body and encode as base64
        const responseText = await response.body.text();
        const responseBodyBase64 = Buffer.from(responseText).toString('base64');
        const responseTimeMs = Date.now() - startTime;

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

        // If this request is part of an event, update the event status
        if (webhookRequest.eventId) {
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
          await db
            .update(Tunnels)
            .set({
              lastRequestAt: new Date(),
              requestCount: sql`${Tunnels.requestCount} + 1`,
            })
            .where(eq(Tunnels.clientId, webhookRequest.tunnelId));
        }
      } catch (error) {
        console.error('Failed to forward request:', error);

        const failedReason =
          error instanceof Error
            ? error.message
            : 'Unknown error occurred while forwarding request';

        await db
          .update(Requests)
          .set({
            status: 'failed',
            failedReason,
            completedAt: new Date(),
            connectionId: connectionId ?? undefined,
          })
          .where(eq(Requests.id, webhookRequest.id));

        // If this request is part of an event, check if we should retry or mark as failed
        if (webhookRequest.eventId) {
          const event = await db.query.Events.findFirst({
            where: eq(Events.id, webhookRequest.eventId),
          });

          if (event) {
            if (event.retryCount < event.maxRetries) {
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
            } else {
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
    const { userId, orgId } = useAuthStore.getState();
    const { connectionId } = useConnectionStore.getState();
    const { ping: pingEnabled } = useCliStore.getState();

    if (!userId || !orgId) {
      throw new Error('User or org not authenticated');
    }

    if (!connectionId && pingEnabled !== false) {
      throw new Error('Connection not found');
    }

    // Get the original webhook timestamp from the request being replayed
    const timestamp = request.timestamp || request.createdAt;

    // If the request is part of an event, increment its retry count
    if (request.eventId) {
      const event = await db.query.Events.findFirst({
        where: eq(Events.id, request.eventId),
      });

      if (event) {
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

    // Insert the new request, maintaining the event relationship if it exists
    await db.insert(Requests).values({
      tunnelId: request.tunnelId,
      eventId: request.eventId, // Keep the original event association
      apiKey: request.apiKey,
      userId: userId,
      orgId: orgId,
      connectionId: connectionId ?? undefined,
      request: request.request,
      status: 'pending',
      timestamp,
    });

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
