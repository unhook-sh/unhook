import { Box, Text } from 'ink';
import type { FC } from 'react';
import { useRequestStore } from '~/lib/request-store';
import type { RouteProps } from '~/lib/router';
import { RequestDetails } from '../_components/request-details';

export const RequestPage: FC<RouteProps> = ({ params }) => {
  const requestId = params?.id;
  const requests = useRequestStore.use.requests();
  const request = requests.find((r) => r.id === requestId);

  if (!request) {
    return (
      <Box>
        <Text color="red">Request not found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%">
      <RequestDetails request={request} />
    </Box>
  );
};
