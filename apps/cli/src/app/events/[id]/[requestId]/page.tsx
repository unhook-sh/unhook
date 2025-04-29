import { Box, Text } from 'ink';
import type { FC } from 'react';
import { useEventStore } from '~/stores/events-store';
import type { RouteProps } from '~/stores/router-store';
import { EventRequestDetails } from './_components/request-details';

export const EventRequestPage: FC<RouteProps> = ({ params }) => {
  const eventId = params?.id;
  const requestId = params?.requestId;
  const events = useEventStore.use.events();
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    return (
      <Box>
        <Text color="red">Event not found</Text>
      </Box>
    );
  }

  const request = event.requests?.find((r) => r.id === requestId);

  if (!request) {
    return (
      <Box>
        <Text color="red">Request not found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%">
      <EventRequestDetails event={event} request={request} />
    </Box>
  );
};
