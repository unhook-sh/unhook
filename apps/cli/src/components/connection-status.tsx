import figures from 'figures';
import { Box, Text } from 'ink';
import { useCliStore } from '~/stores/cli-store';
import { useConfigStore } from '~/stores/config-store';
import { useConnectionStore } from '~/stores/connection-store';
import { Spinner } from './spinner';

export function ConnectionStatus() {
  const isConnected = useConnectionStore.use.isAnyConnected();
  const connectionId = useConnectionStore.use.connectionId();
  const delivery = useConfigStore.use.delivery();
  const debug = useCliStore.use.verbose();

  if (!delivery?.length) {
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
            {delivery.map((rule) => (
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
