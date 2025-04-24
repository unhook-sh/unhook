import { Box, Text } from 'ink';
import type { FC } from 'react';
import { useEventStore } from '~/stores/events-store';
import type { RouteProps } from '~/stores/router-store';
import { EventDetails } from '../_components/event-details';

export const EventPage: FC<RouteProps> = ({ params }) => {
  const eventId = params?.id;
  const events = useEventStore.use.events();
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    return (
      <Box>
        <Text color="red">Event not found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%">
      <EventDetails event={event} />
    </Box>
  );
};
