import { Box, Text } from 'ink';
import { useConfigStore } from '~/stores/config-store';

export function UnauthorizedPage() {
  const webhookId = useConfigStore.use.webhookId();

  return (
    <Box flexDirection="column">
      <Text>You are not authorized to access webhook {webhookId}</Text>
    </Box>
  );
}
