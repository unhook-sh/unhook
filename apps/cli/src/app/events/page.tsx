import { Box, Text } from 'ink';
import type { FC } from 'react';
import type { RouteProps } from '~/stores/router-store';

export const EventsPage: FC<RouteProps> = () => {
  return (
    <Box>
      <Text>Events</Text>
    </Box>
  );
};
