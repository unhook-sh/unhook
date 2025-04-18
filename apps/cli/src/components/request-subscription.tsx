import type { Tables } from '@unhook/db';
import { useSubscription } from '@unhook/db/supabase/client';
import { debug } from '@unhook/logger';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useRequestStore } from '../stores/request-store';

const log = debug('unhook:cli:request-subscription');

// Inner component that handles the actual subscription logic
export const RequestSubscription = memo(function RequestSubscription() {
  log('RequestSubscription');

  const subscriptionMounted = useRef(false);
  const unmountingRef = useRef(false);
  const fetchRequests = useRequestStore.use.fetchRequests();

  // Memoize subscription callbacks to prevent unnecessary recreations
  const requestCallbacks = useMemo(
    () => ({
      onDelete: () => {
        log('Request deleted');
        if (!unmountingRef.current) {
          fetchRequests();
        }
      },
      onError: (error: Error) => {
        log('Request subscription error:', error);
      },
      onInsert: async (payload: Tables<'requests'>) => {
        log('Request inserted');
        if (subscriptionMounted.current && !unmountingRef.current) {
          fetchRequests();
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
          fetchRequests();
        }
      },
    }),
    [fetchRequests],
  );

  const eventCallbacks = useMemo(
    () => ({
      onDelete: () => {
        log('Event deleted');
        if (!unmountingRef.current) {
          fetchRequests();
        }
      },
      onError: (error: Error) => {
        log('Event subscription error:', error);
      },
      onInsert: () => {
        log('Event inserted');
        if (!unmountingRef.current) {
          fetchRequests();
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
          fetchRequests();
        }
      },
    }),
    [fetchRequests],
  );

  // Subscribe to requests
  const { status: requestStatus, unsubscribe: unsubscribeRequests } =
    useSubscription({
      ...requestCallbacks,
      event: '*',
      table: 'requests',
    });

  // // Subscribe to events
  // const { status: eventStatus, unsubscribe: unsubscribeEvents } =
  //   useSubscription({
  //     ...eventCallbacks,
  //     event: '*',
  //     table: 'events',
  //   });

  // Log combined subscription status
  useEffect(() => {
    const isConnected = requestStatus === 'connected';
    if (isConnected) {
      log('All subscriptions connected');
    } else {
      log('Subscription(s) disconnected or connecting', {
        requestStatus,
      });
    }
  }, [requestStatus]);

  // Track component mount state and cleanup subscriptions on unmount
  useEffect(() => {
    subscriptionMounted.current = true;
    unmountingRef.current = false;

    return () => {
      log('Component unmounting, disconnecting subscriptions');
      unmountingRef.current = true;
      subscriptionMounted.current = false;
      unsubscribeRequests();
      // unsubscribeEvents();
    };
  }, [unsubscribeRequests]);

  return null;
});
