import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Box, measureElement } from 'ink';
import type { DOMElement } from 'ink';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Table } from '~/components/table';
import { useForceUpdate } from '~/hooks/use-force-update';
import { capture } from '~/lib/posthog';
import { useEventStore } from '~/stores/events-store';
import { useRouterStore } from '~/stores/router-store';
import type { RouteProps } from '~/stores/router-store';
import { columns } from './_components/events-table-columns';

export const EventsPage: FC<RouteProps> = () => {
  const selectedEventId = useEventStore.use.selectedEventId();
  const setSelectedEventId = useEventStore.use.setSelectedEventId();
  const events = useEventStore.use.events();
  const totalCount = useEventStore.use.totalCount();
  const [selectedIndex, _setSelectedIndex] = useState(
    events.findIndex((event) => event.id === selectedEventId),
  );
  const navigate = useRouterStore.use.navigate();
  useForceUpdate({ intervalMs: 1000 });

  const handleViewDetails = useCallback(
    (event: EventTypeWithRequest) => {
      setSelectedEventId(event.id);
      navigate('/events/:id', { id: event.id });
    },
    [setSelectedEventId, navigate],
  );

  const replayRequest = useEventStore.use.replayEvent();

  const ref = useRef<DOMElement>(null);
  const [_containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const height = measureElement(ref.current).height;
      setContainerHeight(height);
    }
  }, []);

  return (
    <Box flexDirection="row" ref={ref}>
      <Table<EventTypeWithRequest>
        totalCount={totalCount}
        data={events}
        columns={columns}
        initialIndex={selectedIndex}
        onSelectionChange={(index) => {
          const event = events[index];
          if (event) {
            setSelectedEventId(event.id);
          }
        }}
        actions={[
          {
            key: 'return',
            label: 'View Details',
            onAction: (_, index) => {
              const event = events[index];
              capture({
                event: 'hotkey_pressed',
                properties: {
                  hotkey: 'return',
                  hokeyName: 'View Details',
                  eventId: event?.id,
                },
              });
              if (event) {
                handleViewDetails(event);
              }
            },
          },
          {
            key: 'r',
            label: 'Replay',
            onAction: (_, index) => {
              const event = events[index];
              capture({
                event: 'hotkey_pressed',
                properties: {
                  hotkey: 'r',
                  hokeyName: 'Replay',
                  eventId: event?.id,
                },
              });
              if (event) {
                void replayRequest(event);
              }
            },
          },
        ]}
      />
    </Box>
  );
};
