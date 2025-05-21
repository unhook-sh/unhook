import type { EventTypeWithRequest, RequestType } from '@unhook/db/schema';
import { Box, Text } from 'ink';
import { type FC, useCallback, useState } from 'react';
import { SyntaxHighlight } from '~/components/syntax-highlight';
import { Table } from '~/components/table';
import { useForceUpdate } from '~/hooks/use-force-update';
import { capture } from '~/lib/posthog';
import { useEventStore } from '~/stores/events-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';
import { extractEventName, tryDecodeBase64 } from '~/utils/extract-event-name';
import { formatRelativeTime } from '~/utils/format-relative-time';
import { columns } from './_components/requests-table-columns';

function tryParseJson(str: string): string {
  try {
    const json = JSON.parse(str);
    return JSON.stringify(json, null, 2);
  } catch {
    return str;
  }
}

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

  if (!event) {
    return (
      <Box>
        <Text color="red">Event not found</Text>
      </Box>
    );
  }

  const selectedRequest = event.requests?.[selectedIndex];
  // Compute the body to display: prefer selected request, else event originRequest
  let formattedRequestBody: string | null = null;
  if (selectedRequest?.request?.body) {
    const decoded = tryDecodeBase64(selectedRequest.request.body);
    formattedRequestBody = tryParseJson(decoded);
  } else if (event.originRequest.body) {
    const decoded = tryDecodeBase64(event.originRequest.body);
    formattedRequestBody = tryParseJson(decoded);
  }

  return (
    <Box flexDirection="row" width="100%">
      {/* Left: Table */}
      <Box flexDirection="column" width="60%" minWidth={60}>
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
          totalCount={totalCount}
          data={event.requests}
          columns={columns}
          initialIndex={0}
          onSelectionChange={(index) => {
            setSelectedIndex(index);
            const request = event.requests?.[index];
            if (request) {
              setSelectedRequestId(request.id);
            }
          }}
          actions={[
            {
              key: 'return',
              label: 'View Details',
              onAction: (_, index) => {
                const request = event.requests?.[index];
                capture({
                  event: 'hotkey_pressed',
                  properties: {
                    hotkey: 'return',
                    hokeyName: 'View Details',
                    eventId: event?.id,
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
                  event: 'hotkey_pressed',
                  properties: {
                    hotkey: 'r',
                    hokeyName: 'Replay',
                    eventId: event?.id,
                    requestId: request?.id,
                  },
                });
                if (request) {
                  void replayRequest(request);
                }
              },
            },
          ]}
        />
      </Box>
      {/* Right: Selected request body */}
      <Box flexDirection="column" width="40%" minWidth={40} paddingLeft={2}>
        <Box marginTop={1}>
          {formattedRequestBody ? (
            <SyntaxHighlight code={formattedRequestBody} language="json" />
          ) : (
            <Text dimColor>No request body</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};
