import { Box, Text } from 'ink';
import { env } from '~/env';
import { useConfigStore } from '~/stores/config-store';

export function HelpPage() {
  const webhookId = useConfigStore.use.webhookId();

  const webhookUrl = `${env.NEXT_PUBLIC_API_URL}/${webhookId}`;

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Unhook CLI Help</Text>
      <Box marginY={1}>
        <Text dimColor>Press ESC to go back</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="blue">
          About
        </Text>
        <Text>
          Unhook is a modern webhook development tool that enables teams to
          easily test webhooks locally.
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="blue">
          Your Webhook URL
        </Text>
        <Text>{webhookUrl}</Text>
        <Text dimColor>
          Use this URL in your webhook provider's configuration.
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="blue">
          Quick Start
        </Text>
        <Text>1. Configure your webhook provider to use the URL above</Text>
        <Text>2. Keep this CLI running to receive webhooks</Text>
        <Text>3. Use the Requests page to view incoming webhooks</Text>
        <Text>4. Press ? anytime to view available keyboard shortcuts</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="blue">
          Navigation Tips
        </Text>
        <Text>- Use arrow keys or j/k to navigate lists</Text>
        <Text>- Press ESC to go back to previous screen</Text>
        <Text>- Press q to quit the application</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold color="blue">
          Need More Help?
        </Text>
        <Text>Visit: https://unhook.sh/docs</Text>
        <Text>GitHub: https://github.com/unhook-sh/unhook</Text>
      </Box>
    </Box>
  );
}
