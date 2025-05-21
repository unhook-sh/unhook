import figures from 'figures';
import { Box, Text } from 'ink';
import { useCliStore } from '~/stores/cli-store';
import { useConfigStore } from '~/stores/config-store';
import { useConnectionStore } from '~/stores/connection-store';
import { Spinner } from './spinner';

export function ConnectionStatus() {
  const isConnected = useConnectionStore.use.isAnyConnected();
  const connectionId = useConnectionStore.use.connectionId();
  const deliver = useConfigStore.use.deliver();
  const debug = useCliStore.use.debug();

  if (!deliver?.length) {
    return (
      <Box flexDirection="column">
        <Text>
          <Text color="yellow">{figures.circleFilled} </Text>
          <Text dimColor>No delivery rules configured</Text>
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
            {deliver.map((rule) => (
              <Text key={`${rule.source}-${rule.destination}`}>
                {' '}
                to {rule.destination.toString()}
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
      {debug && (
        <Box>
          <Text dimColor>Connection ID: {connectionId ?? 'Not connected'}</Text>
        </Box>
      )}
    </Box>
  );
}
