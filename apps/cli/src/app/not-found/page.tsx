import { Box, Text } from 'ink';

export function NotFoundPage() {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Not Found</Text>
      <Text>The webhook id you provided does not exist.</Text>
    </Box>
  );
}
