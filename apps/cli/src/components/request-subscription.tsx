import type { RequestType, ResponsePayload } from '@acme/db/schema';
import { useSubscription } from '@acme/db/supabase/client';
import { useEffect } from 'react';
import { useSelectionStore } from '~/lib/store';

export function RequestSubscription() {
  const fetchRequests = useSelectionStore((state) => state.fetchRequests);
  const handlePendingRequest = useSelectionStore(
    (state) => state.handlePendingRequest,
  );

  // Initial fetch
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Subscribe to request changes
  useSubscription({
    event: '*',
    onDelete: () => {
      void fetchRequests();
    },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
    onInsert: async (payload) => {
      await fetchRequests();
      // Handle pending requests
      if (
        payload &&
        typeof payload === 'object' &&
        'status' in payload &&
        payload.status === 'pending' &&
        typeof payload.request === 'object' &&
        payload.request !== null
      ) {
        const requestPayload = payload.request as Record<string, unknown>;
        const request: RequestType = {
          ...payload,
          createdAt: new Date(payload.createdAt),
          completedAt: payload.completedAt
            ? new Date(payload.completedAt)
            : null,
          request: {
            id: requestPayload.id as string,
            method: requestPayload.method as string,
            url: requestPayload.url as string,
            headers: requestPayload.headers as Record<string, string>,
            size: requestPayload.size as number,
            body: requestPayload.body as string | undefined,
            timestamp: requestPayload.timestamp as number,
            contentType: requestPayload.contentType as string,
            clientIp: requestPayload.clientIp as string,
          },
          response: payload.response as ResponsePayload | null,
          status: 'pending',
        };
        await handlePendingRequest(request);
      }
    },
    onStatusChange: (newStatus) => {
      console.log('Subscription status:', newStatus);
    },
    onUpdate: () => {
      void fetchRequests();
    },
    table: 'requests',
  });

  return null;
}
