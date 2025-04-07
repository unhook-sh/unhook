import figures from 'figures';
import { Box, Text } from 'ink';
import { useCliStore } from '~/lib/cli-store';
import { useConnectionStore } from '~/lib/connection-store';
import { Spinner } from './spinner';

export function ConnectionStatus() {
  const isConnected = useConnectionStore.use.isConnected();
  const lastConnectedAt = useConnectionStore.use.lastConnectedAt();
  const lastDisconnectedAt = useConnectionStore.use.lastDisconnectedAt();
  const port = useCliStore.use.port();
  const pid = useConnectionStore.use.pid();

  function formatDate(date: Date | null) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString();
  }

  return (
    <Box flexDirection="column">
      <Box>
        {isConnected ? (
          <Text>
            <Text color="green">{figures.circleFilled}</Text> Connected to
            server on port {port}
            {pid ? (
              <Text dimColor> (PID: {pid})</Text>
            ) : (
              <Text dimColor> (PID: unknown)</Text>
            )}
          </Text>
        ) : (
          <Text>
            <Spinner color="red" />
            <Text> Waiting for server to start on port {port}</Text>
          </Text>
        )}
      </Box>
      <Box>
        <Text dimColor>
          {lastConnectedAt && (
            <>Last connected at: {formatDate(lastConnectedAt)}</>
          )}
          {lastDisconnectedAt && (
            <> • Last connected at: {formatDate(lastDisconnectedAt)}</>
          )}
        </Text>
      </Box>
    </Box>
  );
}
