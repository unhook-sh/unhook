import type { Tables } from '@unhook/db';
import type { RequestType } from '@unhook/db/schema';
import { useSubscription } from '@unhook/db/supabase/client';
import { debug } from '@unhook/logger';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useRequestStore } from '~/stores/request-store';
import { useTableStore } from './table/store';

const log = debug('unhook:cli:request-subscription');

// Inner component that handles the actual subscription logic
export const RequestSubscription = memo(function RequestSubscription() {
  log('RequestSubscription');
  const fetchRequests = useRequestStore.use.fetchRequests();
  const handlePendingRequest = useRequestStore.use.handlePendingRequest();
  const currentPage = useTableStore.use.currentPage();
  const pageSize = useTableStore.use.pageSize();

  // Use refs to track component state
  const initialFetchDone = useRef(false);
  const subscriptionMounted = useRef(false);
  const unmountingRef = useRef(false);

  // Memoize subscription callbacks to prevent unnecessary recreations
  const requestCallbacks = useMemo(
    () => ({
      onDelete: () => {
        log('Request deleted');
        if (!unmountingRef.current) {
          void fetchRequests({
            limit: pageSize,
            offset: currentPage * pageSize,
          });
        }
      },
      onError: (error: Error) => {
        log('Request subscription error:', error);
      },
      onInsert: async (payload: Tables<'requests'>) => {
        log('Request inserted');
        if (subscriptionMounted.current && !unmountingRef.current) {
          await fetchRequests();
          if (
            payload &&
            'status' in payload &&
            payload.status === 'pending' &&
            typeof payload.request === 'object' &&
            payload.request !== null
          ) {
            await handlePendingRequest(payload as unknown as RequestType);
          }
        }
      },
      onStatusChange: (
        status: 'connecting' | 'connected' | 'disconnected' | 'error',
      ) => {
        log('Request subscription status:', status);
      },
      onUpdate: () => {
        log('Request updated');
        if (!unmountingRef.current) {
          void fetchRequests({
            limit: pageSize,
            offset: currentPage * pageSize,
          });
        }
      },
    }),
    [fetchRequests, handlePendingRequest, currentPage, pageSize],
  );

  const eventCallbacks = useMemo(
    () => ({
      onDelete: () => {
        log('Event deleted');
        if (!unmountingRef.current) {
          void fetchRequests({
            limit: pageSize,
            offset: currentPage * pageSize,
          });
        }
      },
      onError: (error: Error) => {
        log('Event subscription error:', error);
      },
      onInsert: () => {
        log('Event inserted');
        if (!unmountingRef.current) {
          void fetchRequests({
            limit: pageSize,
            offset: currentPage * pageSize,
          });
        }
      },
      onStatusChange: (
        status: 'connecting' | 'connected' | 'disconnected' | 'error',
      ) => {
        log('Event subscription status:', status);
      },
      onUpdate: () => {
        log('Event updated');
        if (!unmountingRef.current) {
          void fetchRequests({
            limit: pageSize,
            offset: currentPage * pageSize,
          });
        }
      },
    }),
    [fetchRequests, currentPage, pageSize],
  );

  // Subscribe to requests
  const { status: requestStatus, unsubscribe: unsubscribeRequests } =
    useSubscription({
      ...requestCallbacks,
      event: '*',
      table: 'requests',
    });

  // Subscribe to events
  const { status: eventStatus, unsubscribe: unsubscribeEvents } =
    useSubscription({
      ...eventCallbacks,
      event: '*',
      table: 'events',
    });

  // Log combined subscription status
  useEffect(() => {
    const isConnected =
      requestStatus === 'connected' && eventStatus === 'connected';
    if (isConnected) {
      log('All subscriptions connected');
    } else {
      log('Subscription(s) disconnected or connecting', {
        requestStatus,
        eventStatus,
      });
    }
  }, [requestStatus, eventStatus]);

  // Initial fetch only once
  useEffect(() => {
    if (!initialFetchDone.current && !unmountingRef.current) {
      log('Performing initial fetch');
      void fetchRequests({ limit: pageSize, offset: currentPage * pageSize });
      initialFetchDone.current = true;
    }
  }, [fetchRequests, currentPage, pageSize]);

  // Track component mount state and cleanup subscriptions on unmount
  useEffect(() => {
    subscriptionMounted.current = true;
    unmountingRef.current = false;

    return () => {
      log('Component unmounting, disconnecting subscriptions');
      unmountingRef.current = true;
      subscriptionMounted.current = false;
      unsubscribeRequests();
      unsubscribeEvents();
    };
  }, [unsubscribeRequests, unsubscribeEvents]);

  return null;
});
