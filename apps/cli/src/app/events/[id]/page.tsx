import type { EventTypeWithRequest, RequestType } from '@unhook/db/schema';
import { Box, Text } from 'ink';
import { type FC, useCallback } from 'react';
import { Table } from '~/components/table';
import { useForceUpdate } from '~/hooks/use-force-update';
import { capture } from '~/lib/posthog';
import { useEventStore } from '~/stores/events-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';
import { extractEventName } from '~/utils/extract-event-name';
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

  return (
    <Box flexDirection="column" width="100%">
      <Box borderStyle="round" flexDirection="column">
        <Box gap={1}>
          <Text bold>{event.from}</Text>
          <Text bold>
            {extractEventName(event.originRequest.body)} -{' '}
            {event.originRequest.method}
          </Text>
          <Text dimColor>{formatRelativeTime(new Date(event.timestamp))}</Text>
        </Box>
        {/* <Box flexDirection="column"> */}
        {/* <Text dimColor>{event.id}</Text> */}
        {/* </Box> */}
      </Box>
      <Table<RequestType>
        totalCount={totalCount}
        data={event.requests}
        columns={columns}
        initialIndex={0}
        onSelectionChange={(index) => {
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
  );
};
