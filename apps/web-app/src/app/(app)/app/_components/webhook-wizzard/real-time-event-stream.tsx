'use client';

import { api } from '@unhook/api/react';
import { extractBody } from '@unhook/client/utils/extract-body';
import { extractEventName } from '@unhook/client/utils/extract-event-name';
import { getSourceDisplayText } from '@unhook/client/utils/source-display';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useRef, useState } from 'react';

interface RealTimeEventStreamProps {
  webhookUrl: string;
  onEventReceived?: () => void;
}

export function RealTimeEventStream({
  webhookUrl,
  onEventReceived,
}: RealTimeEventStreamProps) {
  const [events, setEvents] = useState<EventTypeWithRequest[]>([]);
  const [hasReceivedEvent, setHasReceivedEvent] = useState(false);
  const previousEventCountRef = useRef(0);

  const {
    data: fetchedEvents,
    isLoading,
    error,
  } = api.events.byWebhookUrl.useQuery(
    { webhookUrl },
    {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    },
  );

  useEffect(() => {
    if (fetchedEvents) {
      // Filter out events with source "example"
      const filteredEvents = fetchedEvents.filter(
        (event) => event.source !== 'unhook_example',
      );

      // Check if we have new events (excluding example events)
      const currentEventCount = filteredEvents.length;
      if (
        currentEventCount > previousEventCountRef.current &&
        !hasReceivedEvent
      ) {
        setHasReceivedEvent(true);
        onEventReceived?.();
      }
      previousEventCountRef.current = currentEventCount;

      // Keep only the latest 10 events
      setEvents(filteredEvents.slice(0, 10));
    }
  }, [fetchedEvents, hasReceivedEvent, onEventReceived]);

  const getStatusColor = (eventStatus: string) => {
    switch (eventStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (eventStatus: string) => {
    switch (eventStatus) {
      case 'completed':
        return <Icons.Check className="size-3" />;
      case 'failed':
        return <Icons.X className="size-3" />;
      case 'processing':
        return <Icons.Spinner className="size-3 animate-spin" />;
      case 'pending':
        return <Icons.Clock className="size-3" />;
      default:
        return <Icons.Clock className="size-3" />;
    }
  };

  // Determine connection status based on query state
  const connectionStatus = error
    ? 'error'
    : isLoading
      ? 'connecting'
      : 'connected';

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Live Events</CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={`size-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'error'
                  ? 'Error'
                  : 'Connecting...'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasReceivedEvent && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Icons.Sparkles className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Waiting for your first webhook event...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Send a test request to your webhook URL to see it appear here!
            </p>
          </div>
        )}

        {events.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.map((event) => (
              <div
                className="p-3 bg-muted/50 rounded-lg border border-border/50 animate-in fade-in-0 slide-in-from-top-1"
                key={event.id}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${getStatusColor(event.status)} flex items-center gap-1`}
                      variant="secondary"
                    >
                      {getStatusIcon(event.status)}
                      {event.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-mono text-muted-foreground">
                        {getSourceDisplayText(event)}
                      </span>
                      {(() => {
                        const eventName = extractEventName(
                          event.originRequest?.body,
                        );
                        return eventName ? (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-medium text-foreground">
                              {eventName}
                            </span>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                  </span>
                </div>

                {event.originRequest && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {event.originRequest?.method || 'POST'}
                      </span>
                      <span className="font-mono">
                        {event.originRequest?.headers?.['user-agent']?.slice(
                          0,
                          30,
                        ) || 'Unknown'}
                        {event.originRequest?.headers?.['user-agent']?.length &&
                          event.originRequest?.headers?.['user-agent']?.length >
                            30 &&
                          '...'}
                      </span>
                    </div>
                    {event.originRequest?.body && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Body:</span>
                        <span className="ml-1 font-mono">
                          {(() => {
                            const body = event.originRequest.body;
                            if (typeof body === 'string') {
                              return extractBody(body)?.slice(0, 50);
                            }
                            return JSON.stringify(body).slice(0, 50);
                          })()}
                          ...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
