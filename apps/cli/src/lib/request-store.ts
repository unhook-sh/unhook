import { db } from '@unhook/db/client';
import { Requests, Tunnels } from '@unhook/db/schema';
import type { RequestType } from '@unhook/db/schema';
import debug from 'debug';
import { desc, eq, sql } from 'drizzle-orm';
import { request as undiciRequest } from 'undici';
import { createStore } from 'zustand';
import { useAuthStore } from './auth/store';
import { useCliStore } from './cli-store';
import { useConnectionStore } from './connection-store';
import { createSelectors } from './zustand-create-selectors';

const log = debug('unhook:cli:request-store');

interface RequestState {
  requests: RequestType[];
  selectedRequestId: string | null;
  isLoading: boolean;
  isDetailsVisible: boolean;
}

interface RequestActions {
  setRequests: (requests: RequestType[]) => void;
  setSelectedRequestId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsDetailsVisible: (isVisible: boolean) => void;
  initializeSelection: () => void;
  fetchRequests: () => Promise<void>;
  handlePendingRequest: (webhookRequest: RequestType) => Promise<void>;
  replayRequest: (request: RequestType) => Promise<void>;
}

type RequestStore = RequestState & RequestActions;

const defaultRequestState: RequestState = {
  requests: [],
  selectedRequestId: null,
  isLoading: true,
  isDetailsVisible: false,
};

const store = createStore<RequestStore>()((set, get) => ({
  ...defaultRequestState,
  setRequests: (requests) => {
    set({ requests });
  },
  setSelectedRequestId: (id) => set({ selectedRequestId: id }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsDetailsVisible: (isVisible) => set({ isDetailsVisible: isVisible }),
  initializeSelection: () => {
    const { selectedRequestId, requests } = get();
    if (!selectedRequestId && requests.length > 0) {
      set({ selectedRequestId: requests[0]?.id ?? null });
    }
  },
  fetchRequests: async () => {
    const requests = await db.query.Requests.findMany({
      orderBy: [desc(Requests.createdAt)],
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
  handlePendingRequest: async (webhookRequest: RequestType) => {
    const { port, redirect } = useCliStore.getState();
    const { connectionId } = useConnectionStore.getState();

    if (webhookRequest.status === 'pending') {
      try {
        // Determine the base URL based on redirect or port
        const baseUrl = redirect || `http://localhost:${port}`;
        // Ensure we don't double up on slashes when joining URLs
        const url = new URL(webhookRequest.request.url, baseUrl).toString();

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
        log('Sending request to %s', url);
        const response = await undiciRequest(url, {
          method: webhookRequest.request.method,
          headers: webhookRequest.request.headers,
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

        await get().fetchRequests();
      }
    }
  },
  replayRequest: async (request: RequestType) => {
    const { userId, orgId } = useAuthStore.getState();
    const { connectionId } = useConnectionStore.getState();
    const { ping: pingEnabled } = useCliStore.getState();

    if (!userId || !orgId) {
      throw new Error('User or org not authenticated');
    }

    if (!connectionId && pingEnabled !== false) {
      throw new Error('Connection not found');
    }

    // Insert the new request
    await db.insert(Requests).values({
      tunnelId: request.tunnelId,
      apiKey: request.apiKey,
      userId: userId,
      orgId: orgId,
      connectionId: connectionId ?? undefined,
      request: request.request,
      status: 'pending',
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
