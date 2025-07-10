import { extractBody } from '@unhook/client/utils/extract-body';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Box, Text, useInput } from 'ink';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SyntaxHighlight } from '~/components/syntax-highlight';
import { Table } from '~/components/table';
import { useDimensions } from '~/hooks/use-dimensions';
import { useForceUpdate } from '~/hooks/use-force-update';
import { capture } from '~/lib/posthog';
import { useEventStore } from '~/stores/events-store';
import type { RouteProps } from '~/stores/router-store';
import { useRouterStore } from '~/stores/router-store';
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

  const dimensions = useDimensions();
  const TABLE_MIN_WIDTH = 60;
  const BODY_MIN_WIDTH = 40;
  const SHOW_SPLIT_THRESHOLD = 180;
  const [showSplitView, setShowSplitView] = useState(
    dimensions.width >= SHOW_SPLIT_THRESHOLD,
  );

  // Update split view if dimensions change and user hasn't toggled manually
  // (Optional: you can add logic to only update if not manually toggled)
  useEffect(() => {
    setShowSplitView(dimensions.width >= SHOW_SPLIT_THRESHOLD);
  }, [dimensions.width]);

  useInput((input, key) => {
    if (input === 'h' && !key.ctrl && !key.meta && !key.shift) {
      capture({
        event: 'hotkey_pressed_events_page',
        properties: {
          hokeyName: 'Toggle Split View',
          hotkey: 'h',
        },
      });
      setShowSplitView((prev) => !prev);
    }
  });

  // Find the selected event by index
  const selectedEvent = events[selectedIndex] || null;

  // Compute the body to display: use originRequest.body if available
  let formattedRequestBody: string | null = null;
  if (selectedEvent?.originRequest?.body) {
    formattedRequestBody = extractBody(selectedEvent.originRequest.body);
  }

  const ref = useRef<React.ComponentRef<typeof Box>>(null);

  return (
    <Box flexDirection="row" height="100%" ref={ref} width="100%">
      <Box
        flexDirection="column"
        height="100%"
        minWidth={showSplitView ? TABLE_MIN_WIDTH : undefined}
        width={showSplitView ? '60%' : '100%'}
      >
        <Table<EventTypeWithRequest>
          actions={[
            {
              key: 'return',
              label: 'View Details',
              onAction: (_, index) => {
                const event = events[index];
                capture({
                  event: 'hotkey_pressed',
                  properties: {
                    eventId: event?.id,
                    hokeyName: 'View Details',
                    hotkey: 'return',
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
                    eventId: event?.id,
                    hokeyName: 'Replay',
                    hotkey: 'r',
                  },
                });
                if (event) {
                  void replayRequest(event);
                }
              },
            },
          ]}
          columns={columns}
          data={events}
          initialIndex={selectedIndex}
          key={showSplitView ? 'split' : 'full'}
          onSelectionChange={(index) => {
            const event = events[index];
            if (event) {
              setSelectedEventId(event.id);
              _setSelectedIndex(index);
            }
          }}
          totalCount={totalCount}
        />
      </Box>
      {showSplitView && (
        <Box
          flexDirection="column"
          minWidth={BODY_MIN_WIDTH}
          paddingLeft={2}
          width="40%"
        >
          <Box marginTop={1}>
            {formattedRequestBody ? (
              <SyntaxHighlight code={formattedRequestBody} language="json" />
            ) : (
              <Text dimColor>No request body</Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
