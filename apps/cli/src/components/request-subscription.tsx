import type { RequestType } from '@acme/db/schema';
import { useSubscription } from '@acme/db/supabase/client';
import { useEffect } from 'react';
import { useRequestStore } from '~/lib/request-store';

export function RequestSubscription() {
  const fetchRequests = useRequestStore.use.fetchRequests();
  const handlePendingRequest = useRequestStore.use.handlePendingRequest();

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
        await handlePendingRequest(payload as unknown as RequestType);
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
