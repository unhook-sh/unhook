import { debug } from '@unhook/logger';
import { memo, useEffect, useRef } from 'react';
import { useConfigStore } from '~/stores/config-store';
import { useWebhookStore } from '~/stores/webhook-store';
import { useEventStore } from '../stores/events-store';

const log = debug('unhook:cli:event-subscription');
const POLLING_INTERVAL = 5000; // 5 seconds

export const EventSubscription = memo(function EventSubscription() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedEventsRef = useRef<Set<string>>(new Set());
  const fetchEvents = useEventStore.use.fetchEvents();
  const deliverEvent = useEventStore.use.deliverEvent();
  const isAuthorizedForWebhook = useWebhookStore.use.isAuthorizedForWebhook();
  const isCheckingWebhook = useWebhookStore.use.isCheckingWebhook();
  const webhookId = useConfigStore.use.webhookId();

  // Handle polling state changes
  useEffect(() => {
    const pollEvents = async () => {
      if (isAuthorizedForWebhook && !isCheckingWebhook && webhookId) {
        log('Starting event polling', { webhookId });

        const events = await fetchEvents();

        // Initialize processed events set with initial events
        for (const event of events) {
          processedEventsRef.current.add(event.id);
        }

        // Set up polling interval
        intervalRef.current = setInterval(async () => {
          log('Polling for events and requests');
          const events = await fetchEvents();

          // Handle only new events
          for (const event of events) {
            if (!processedEventsRef.current.has(event.id)) {
              processedEventsRef.current.add(event.id);
              await deliverEvent(event);
            }
          }
        }, POLLING_INTERVAL);
      } else {
        log('Stopping event polling', {
          isAuthorizedForWebhook,
          isCheckingWebhook,
        });

        // Clear polling interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    pollEvents();
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    isAuthorizedForWebhook,
    isCheckingWebhook,
    webhookId,
    fetchEvents,
    deliverEvent,
  ]);

  return null;
});
