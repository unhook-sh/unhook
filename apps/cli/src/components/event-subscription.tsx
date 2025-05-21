import type { Tables } from '@unhook/db';
import { useSubscription } from '@unhook/db/supabase/client';
import { debug } from '@unhook/logger';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useWebhookStore } from '~/stores/webhook-store';
import { setRequestSubscriptionCleanup } from '../lib/cli/process';
import { useEventStore } from '../stores/events-store';

const log = debug('unhook:cli:event-subscription');

// Inner component that handles the actual subscription logic
export const EventSubscription = memo(function EventSubscription() {
  const subscriptionMounted = useRef(false);
  const unmountingRef = useRef(false);
  const fetchEvents = useEventStore.use.fetchEvents();
  const handlePendingRequest = useEventStore.use.handlePendingRequest();
  const deliverEvent = useEventStore.use.deliverEvent();
  const isAuthorizedForWebhook = useWebhookStore.use.isAuthorizedForWebhook();

  // Memoize subscription callbacks to prevent unnecessary recreations
  const requestCallbacks = useMemo(
    () => ({
      onDelete: () => {
        log('Request deleted');
        if (!unmountingRef.current) {
          fetchEvents();
        }
      },
      onError: (error: Error) => {
        log('Request subscription error:', error);
      },
      onInsert: async (payload: Tables<'requests'>) => {
        log('Request inserted');
        if (subscriptionMounted.current && !unmountingRef.current) {
          fetchEvents();
          handlePendingRequest(payload);
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
          fetchEvents();
        }
      },
    }),
    [fetchEvents, handlePendingRequest],
  );

  const eventCallbacks = useMemo(
    () => ({
      onDelete: () => {
        log('Event deleted');
        if (!unmountingRef.current) {
          fetchEvents();
        }
      },
      onError: (error: Error) => {
        log('Event subscription error:', error);
      },
      onInsert: (payload: Tables<'events'>) => {
        log('Event inserted');
        if (!unmountingRef.current) {
          fetchEvents();
          deliverEvent(payload);
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
          fetchEvents();
        }
      },
    }),
    [fetchEvents, deliverEvent],
  );

  // Subscribe to requests
  const {
    status: requestStatus,
    unsubscribe: unsubscribeRequests,
    subscribe: subscribeRequests,
  } = useSubscription({
    ...requestCallbacks,
    event: '*',
    table: 'requests',
  });

  // // Subscribe to events
  const {
    status: eventStatus,
    unsubscribe: unsubscribeEvents,
    subscribe: subscribeEvents,
  } = useSubscription({
    ...eventCallbacks,
    event: '*',
    table: 'events',
  });

  useEffect(() => {
    if (isAuthorizedForWebhook) {
      subscribeRequests();
      subscribeEvents();
    }
  }, [isAuthorizedForWebhook, subscribeRequests, subscribeEvents]);

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

  // Track component mount state and cleanup subscriptions on unmount
  useEffect(() => {
    subscriptionMounted.current = true;
    unmountingRef.current = false;

    // Register cleanup with process handlers
    setRequestSubscriptionCleanup(() => {
      log('Process cleanup triggered, disconnecting subscriptions');
      unmountingRef.current = true;
      subscriptionMounted.current = false;
      unsubscribeRequests();
    });

    return () => {
      log('Component unmounting, disconnecting subscriptions');
      unmountingRef.current = true;
      subscriptionMounted.current = false;
      unsubscribeRequests();
      unsubscribeEvents();
    };
  }, [unsubscribeRequests, unsubscribeEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return null;
});
