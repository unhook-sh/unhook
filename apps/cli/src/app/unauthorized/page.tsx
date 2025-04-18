import { Box, Text } from 'ink';
import { useAuthStore } from '~/stores/auth-store';
import { useTunnelStore } from '~/stores/tunnel-store';

export function UnauthorizedPage() {
  const orgId = useAuthStore.use.orgId();
  const userId = useAuthStore.use.user()?.id;
  const tunnelId = useTunnelStore.use.selectedTunnelId();

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Unauthorized</Text>
      <Text>You are not authorized to access this tunnel.</Text>
      <Text>Org ID: {orgId}</Text>
      <Text>User ID: {userId}</Text>
      <Text>Tunnel ID: {tunnelId}</Text>
    </Box>
  );
}
