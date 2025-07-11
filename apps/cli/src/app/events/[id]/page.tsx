import { extractBody } from '@unhook/client/utils/extract-body';
import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type { EventTypeWithRequest, RequestType } from '@unhook/db/schema';
import { Box, Text, useInput } from 'ink';
import { type FC, useCallback, useEffect, useState } from 'react';
import { SyntaxHighlight } from '~/components/syntax-highlight';
import { Table } from '~/components/table';
import { useDimensions } from '~/hooks/use-dimensions';
import { useForceUpdate } from '~/hooks/use-force-update';
import { capture } from '~/lib/posthog';
import { useEventStore } from '~/stores/events-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';
import { formatRelativeTime } from '~/utils/format-relative-time';
import { columns } from './_components/requests-table-columns';

export const EventPage: FC<RouteProps> = ({ params }) => {
  const eventId = params?.id;
  const events = useEventStore.use.events();
  const event = events.find((e) => e.id === eventId);
  const totalCount = event?.requests?.length ?? 0;

  const setSelectedRequestId = useEventStore.use.setSelectedEventId();
  const navigate = useRouterStore.use.navigate();
  useForceUpdate({ intervalMs: 1000 });

  // Track selected request index locally for split view
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleViewDetails = useCallback(
    (props: { event: EventTypeWithRequest; request: RequestType }) => {
      navigate('/events/:id/:requestId', {
        id: props.event.id,
        requestId: props.request.id,
      });
    },
    [navigate],
  );

  const replayRequest = useEventStore.use.replayRequest();

  const dimensions = useDimensions();
  const TABLE_MIN_WIDTH = 60; // sum of all columns' minWidth plus borders/padding
  const BODY_MIN_WIDTH = 40;
  const SHOW_SPLIT_THRESHOLD = 180; // Hide right panel unless terminal is at least 120 columns
  const [showSplitView, setShowSplitView] = useState(
    dimensions.width >= SHOW_SPLIT_THRESHOLD,
  );

  useEffect(() => {
    setShowSplitView(dimensions.width >= SHOW_SPLIT_THRESHOLD);
  }, [dimensions.width]);

  useInput((input, key) => {
    if (input === 'h' && !key.ctrl && !key.meta && !key.shift) {
      capture({
        event: 'hotkey_pressed_event_details_page',
        properties: {
          hokeyName: 'Toggle Split View',
          hotkey: 'h',
        },
      });
      setShowSplitView((prev) => !prev);
    }
  });

  if (!event) {
    return (
      <Box>
        <Text color="red">Event not found</Text>
      </Box>
    );
  }

  const selectedRequest = event.requests?.[selectedIndex];
  // Compute the body to display: prefer selected request's response, else event originRequest response
  let formattedResponseBody: string | null = null;
  if (selectedRequest?.response?.body) {
    formattedResponseBody = extractBody(selectedRequest.response.body);
  }

  return (
    <Box flexDirection="row" width="100%">
      {/* Left: Table */}
      <Box
        flexDirection="column"
        minWidth={showSplitView ? TABLE_MIN_WIDTH : undefined}
        width={showSplitView ? '60%' : '100%'}
      >
        <Box borderStyle="round" flexDirection="column">
          <Box gap={1}>
            <Text bold>{event.source}</Text>
            <Text bold>
              {extractEventName(event.originRequest.body)} -{' '}
              {event.originRequest.method}
            </Text>
            <Text dimColor>
              {formatRelativeTime(new Date(event.timestamp))}
            </Text>
          </Box>
        </Box>
        <Table<RequestType>
          actions={[
            {
              key: 'return',
              label: 'View Details',
              onAction: (_, index) => {
                const request = event.requests?.[index];
                capture({
                  event: 'hotkey_pressed_event_details_page',
                  properties: {
                    eventId: event?.id,
                    hokeyName: 'View Details',
                    hotkey: 'return',
                    requestId: request?.id,
                  },
                });
                if (request) {
                  handleViewDetails({
                    event,
                    request,
                  });
                }
              },
            },
            {
              key: 'r',
              label: 'Replay',
              onAction: (_, index) => {
                const request = event.requests?.[index];
                capture({
                  event: 'hotkey_pressed_event_details_page',
                  properties: {
                    eventId: event?.id,
                    hokeyName: 'Replay',
                    hotkey: 'r',
                    requestId: request?.id,
                  },
                });
                if (request) {
                  void replayRequest(request);
                }
              },
            },
          ]}
          columns={columns}
          data={event.requests}
          initialIndex={0}
          key={showSplitView ? 'split' : 'full'}
          onSelectionChange={(index) => {
            setSelectedIndex(index);
            const request = event.requests?.[index];
            if (request) {
              setSelectedRequestId(request.id);
            }
          }}
          totalCount={totalCount}
        />
      </Box>
      {/* Right: Selected response body */}
      {showSplitView && (
        <Box
          flexDirection="column"
          minWidth={BODY_MIN_WIDTH}
          paddingLeft={2}
          width="40%"
        >
          <Box marginTop={1}>
            {formattedResponseBody ? (
              <SyntaxHighlight code={formattedResponseBody} language="json" />
            ) : (
              <Text dimColor>No response body</Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
