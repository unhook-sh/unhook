import figures from 'figures';
import { Box, Text } from 'ink';
import { useCliStore } from '~/stores/cli-store';
import { useConnectionStore } from '~/stores/connection-store';
import { Spinner } from './spinner';

export function ConnectionStatus() {
  const isConnected = useConnectionStore.use.isConnected();
  const lastConnectedAt = useConnectionStore.use.lastConnectedAt();
  const lastDisconnectedAt = useConnectionStore.use.lastDisconnectedAt();
  const port = useCliStore.use.port?.();
  const ping = useCliStore.use.ping?.();
  const pid = useConnectionStore.use.pid();
  const processName = useConnectionStore.use.processName();
  const redirect = useCliStore.use.redirect?.();

  function formatDate(date: Date | null) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString();
  }

  if (!ping) {
    return (
      <Box flexDirection="column">
        <Text>
          <Text color="yellow">{figures.circleFilled} </Text>
          <Text dimColor>Connection polling is disabled</Text>
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
            {redirect ? (
              <Text> redirecting to {redirect}</Text>
            ) : (
              <>
                <Text> to server on port {port}</Text>
                {pid && (
                  <Text dimColor>
                    {' '}
                    ({processName ?? 'unknown process'} - PID: {pid})
                  </Text>
                )}
              </>
            )}
          </Text>
        ) : (
          <Text>
            <Spinner color="red" />
            {redirect ? (
              <Text> Waiting for connection to redirect to {redirect}</Text>
            ) : (
              <Text> Waiting for server to start on port {port}</Text>
            )}
          </Text>
        )}
      </Box>
      <Box>
        <Text dimColor>
          {lastConnectedAt && (
            <>Last connected at: {formatDate(lastConnectedAt)}</>
          )}
          {lastDisconnectedAt && (
            <> • Last disconnected at: {formatDate(lastDisconnectedAt)}</>
          )}
        </Text>
      </Box>
    </Box>
  );
}
