import type { Tables } from '@unhook/db';
import { useSubscription } from '@unhook/db/supabase/client';
import { debug } from '@unhook/logger';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useConfigStore } from '~/stores/config-store';
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
  const isCheckingWebhook = useWebhookStore.use.isCheckingWebhook();
  const webhookId = useConfigStore.use.webhookId();

  // Memoize subscription callbacks to prevent unnecessary recreations
  const requestCallbacks = useMemo(
    () => ({
      onDelete: async () => {
        log('Request deleted');
        await fetchEvents();
      },
      onError: (error: Error) => {
        log('Request subscription error:', error);
      },
      onInsert: async (payload: Tables<'requests'>) => {
        log('Request inserted', { requestId: payload.id });
        await handlePendingRequest(payload);
        await fetchEvents();
      },
      onStatusChange: async (
        status: 'connecting' | 'connected' | 'disconnected' | 'error',
      ) => {
        log('Request subscription status changed:', status);
      },
      onUpdate: async () => {
        log('Request updated');
        await fetchEvents();
      },
    }),
    [fetchEvents, handlePendingRequest],
  );

  const eventCallbacks = useMemo(
    () => ({
      onDelete: async () => {
        log('Event deleted');
        await fetchEvents();
      },
      onError: (error: Error) => {
        log('Event subscription error:', error);
      },
      onInsert: async (payload: Tables<'events'>) => {
        log('Event inserted', { eventId: payload.id });
        await deliverEvent(payload);
        await fetchEvents();
      },
      onStatusChange: async (
        status: 'connecting' | 'connected' | 'disconnected' | 'error',
      ) => {
        log('Event subscription status changed:', status);
        if (status === 'connected') {
          await fetchEvents();
        }
      },
      onUpdate: async () => {
        log('Event updated');
        if (!unmountingRef.current) {
          await fetchEvents();
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

  // Subscribe to events
  const {
    status: eventStatus,
    unsubscribe: unsubscribeEvents,
    subscribe: subscribeEvents,
  } = useSubscription({
    ...eventCallbacks,
    event: '*',
    table: 'events',
  });

  // Handle subscription state changes
  useEffect(() => {
    if (unmountingRef.current) return;

    log('Subscription state changed', {
      isAuthorizedForWebhook,
      isCheckingWebhook,
      requestStatus,
      eventStatus,
      webhookId,
    });

    if (isAuthorizedForWebhook && !isCheckingWebhook && webhookId) {
      log('Authorized for webhook, subscribing to events and requests', {
        webhookId,
      });
      subscribeRequests();
      subscribeEvents();
    } else {
      log('Not authorized or checking webhook, unsubscribing', {
        isAuthorizedForWebhook,
        isCheckingWebhook,
      });
      unsubscribeRequests();
      unsubscribeEvents();
    }
  }, [
    isAuthorizedForWebhook,
    isCheckingWebhook,
    subscribeRequests,
    subscribeEvents,
    unsubscribeRequests,
    unsubscribeEvents,
    requestStatus,
    eventStatus,
    webhookId,
  ]);

  // Log combined subscription status and fetch events when connected
  useEffect(() => {
    if (unmountingRef.current) return;

    const isConnected =
      requestStatus === 'connected' && eventStatus === 'connected';
    if (
      isConnected &&
      isAuthorizedForWebhook &&
      !isCheckingWebhook &&
      webhookId
    ) {
      log('All subscriptions connected, fetching initial events', {
        webhookId,
      });
      fetchEvents();
    } else {
      log('Subscription(s) disconnected or connecting', {
        requestStatus,
        eventStatus,
        isAuthorizedForWebhook,
        isCheckingWebhook,
        webhookId,
      });
    }
  }, [
    requestStatus,
    eventStatus,
    isAuthorizedForWebhook,
    isCheckingWebhook,
    fetchEvents,
    webhookId,
  ]);

  // Track component mount state and cleanup subscriptions on unmount
  useEffect(() => {
    subscriptionMounted.current = true;
    setRequestSubscriptionCleanup(() => {
      log('Cleaning up subscriptions');
      unsubscribeRequests();
      unsubscribeEvents();
    });

    return () => {
      log('Component unmounting, cleaning up subscriptions');
      unmountingRef.current = true;
      unsubscribeRequests();
      unsubscribeEvents();
    };
  }, [unsubscribeRequests, unsubscribeEvents]);

  return null;
});
