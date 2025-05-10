import { Box, Text } from 'ink';
import { useAuthStore } from '~/stores/auth-store';
import { useWebhookStore } from '~/stores/webhook-store';

export function UnauthorizedPage() {
  const orgId = useAuthStore.use.orgId();
  const userId = useAuthStore.use.user()?.id;
  const webhookId = useWebhookStore.use.selectedWebhookId();

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Unauthorized</Text>
      <Text>You are not authorized to access this webhook.</Text>
      <Text>Org ID: {orgId}</Text>
      <Text>User ID: {userId}</Text>
      <Text>Webhook ID: {webhookId}</Text>
    </Box>
  );
}
