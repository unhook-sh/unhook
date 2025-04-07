import { db } from '@acme/db/client';
import { Requests, Tunnels } from '@acme/db/schema';
import type { RequestType } from '@acme/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { createStore } from 'zustand';
import { useAuthStore } from './auth/store';
import { useCliStore } from './cli-store';
import { useConnectionStore } from './connection-store';
import { createSelectors } from './zustand-create-selectors';

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
  handlePendingRequest: (request: RequestType) => Promise<void>;
  replayRequest: (request: RequestType) => Promise<void>;
}

type RequestStore = RequestState & RequestActions;

const defaultRequestState: RequestState = {
  requests: [],
  selectedRequestId: null,
  isLoading: true,
  isDetailsVisible: true,
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
  handlePendingRequest: async (request: RequestType) => {
    const { port } = useCliStore.getState();
    const { connectionId } = useConnectionStore.getState();

    if (request.status === 'pending') {
      try {
        const url = `http://localhost:${port}${request.request.url}`;

        // Decode base64 request body if it exists
        let requestBody: string | undefined;
        if (request.request.body) {
          try {
            requestBody = Buffer.from(request.request.body, 'base64').toString(
              'utf-8',
            );
          } catch {
            requestBody = request.request.body;
          }
        }

        const startTime = Date.now();
        const response = await fetch(url, {
          method: request.request.method,
          headers: request.request.headers,
          body: requestBody,
        });

        // Get response body and encode as base64
        const responseText = await response.text();
        const responseBodyBase64 = Buffer.from(responseText).toString('base64');
        const responseTimeMs = Date.now() - startTime;

        await db
          .update(Requests)
          .set({
            status: 'completed',
            response: {
              status: response.status,
              headers: Object.fromEntries(response.headers.entries()),
              body: responseBodyBase64,
            },
            responseTimeMs,
            completedAt: new Date(),
            connectionId: connectionId ?? undefined,
          })
          .where(eq(Requests.id, request.id));

        // Update tunnel's lastRequestAt
        if (request.tunnelId) {
          await db
            .update(Tunnels)
            .set({
              lastRequestAt: new Date(),
              requestCount: sql`${Tunnels.requestCount} + 1`,
            })
            .where(eq(Tunnels.clientId, request.tunnelId));
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
          .where(eq(Requests.id, request.id));

        await get().fetchRequests();
      }
    }
  },
  replayRequest: async (request: RequestType) => {
    const userId = useAuthStore.use.userId();
    const orgId = useAuthStore.use.orgId();
    const connectionId = useConnectionStore.use.connectionId();

    // Insert the new request
    await db.insert(Requests).values({
      tunnelId: request.tunnelId,
      apiKey: request.apiKey,
      userId: userId ?? 'FIXME',
      orgId: orgId ?? 'FIXME',
      connectionId: connectionId ?? 'FIXME',
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
