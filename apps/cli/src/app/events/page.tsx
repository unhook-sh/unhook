import { tryDecodeBase64 } from '@unhook/client/utils/extract-event-name';
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

function tryParseJson(str: string): string {
  try {
    const json = JSON.parse(str);
    return JSON.stringify(json, null, 2);
  } catch {
    return str;
  }
}

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
          hotkey: 'h',
          hokeyName: 'Toggle Split View',
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
    const decoded = tryDecodeBase64(selectedEvent.originRequest.body);
    formattedRequestBody = tryParseJson(decoded);
  }

  const ref = useRef<React.ComponentRef<typeof Box>>(null);

  return (
    <Box flexDirection="row" ref={ref} width="100%" height="100%">
      <Box
        flexDirection="column"
        width={showSplitView ? '60%' : '100%'}
        height="100%"
        minWidth={showSplitView ? TABLE_MIN_WIDTH : undefined}
      >
        <Table<EventTypeWithRequest>
          key={showSplitView ? 'split' : 'full'}
          totalCount={totalCount}
          data={events}
          columns={columns}
          initialIndex={selectedIndex}
          onSelectionChange={(index) => {
            const event = events[index];
            if (event) {
              setSelectedEventId(event.id);
              _setSelectedIndex(index);
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
      {showSplitView && (
        <Box
          flexDirection="column"
          width="40%"
          minWidth={BODY_MIN_WIDTH}
          paddingLeft={2}
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
