import { Box, Text } from 'ink';
import { useConfigStore } from '~/stores/config-store';

export function UnauthorizedPage() {
  const webhookUrl = useConfigStore.use.webhookUrl();

  return (
    <Box flexDirection="column">
      <Text>You are not authorized to access webhook {webhookUrl}</Text>
    </Box>
  );
}
