import figures from 'figures';
import { Box, Text } from 'ink';
import { useCliStore } from '~/stores/cli-store';
import { useConnectionStore } from '~/stores/connection-store';
import { Spinner } from './spinner';

export function ConnectionStatus() {
  const isConnected = useConnectionStore.use.isAnyConnected();
  const connectionId = useConnectionStore.use.connectionId();
  const forward = useCliStore.use.forward();

  if (!forward?.length) {
    return (
      <Box flexDirection="column">
        <Text>
          <Text color="yellow">{figures.circleFilled} </Text>
          <Text dimColor>No forwarding rules configured</Text>
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        {isConnected ? (
          <Text>
            <Text color="green">{figures.circleFilled}</Text> Connected
            {forward.map((rule) => (
              <Text key={`${rule.from}-${rule.to}`}>
                {' '}
                to {rule.to.toString()}
              </Text>
            ))}
          </Text>
        ) : (
          <Text>
            <Spinner color="red" />
            <Text> Waiting for connection...</Text>
          </Text>
        )}
      </Box>
      <Box>
        <Text dimColor>Connection ID: {connectionId ?? 'Not connected'}</Text>
      </Box>
    </Box>
  );
}
