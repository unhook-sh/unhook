import type { RequestType } from '@unhook/db/schema';
import { useSubscription } from '@unhook/db/supabase/client';
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
    onStatusChange: (_newStatus) => {
      // console.log('Subscription status:', newStatus);
    },
    onUpdate: () => {
      void fetchRequests();
    },
    table: 'requests',
  });

  useSubscription({
    event: '*',
    onDelete: () => {
      void fetchRequests();
    },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
    onInsert: async () => {
      await fetchRequests();
    },
    onStatusChange: (_newStatus) => {
      // console.log('Subscription status:', newStatus);
    },
    onUpdate: () => {
      void fetchRequests();
    },
    table: 'events',
  });

  return null;
}
