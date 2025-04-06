import net from 'node:net';
import figures from 'figures';
import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import { getProcessIdForPort } from '../utils/get-process-id';
import { Spinner } from './spinner';

interface ConnectionStatusProps {
  port: number;
}

export function ConnectionStatus({ port }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [pid, setPid] = useState<number | null>(null);

  useEffect(() => {
    let isDestroyed = false;
    let socket: net.Socket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      // Clean up any existing socket
      if (socket) {
        socket.destroy();
      }

      socket = new net.Socket();

      socket.on('connect', () => {
        if (!isDestroyed) {
          setIsConnected(true);
          // Get PID when connection is established
          getProcessIdForPort(port).then((foundPid) => {
            if (!isDestroyed) {
              setPid(foundPid);
            }
          });
          socket?.destroy(); // Close connection after successful check
        }
      });

      socket.on('error', () => {
        if (!isDestroyed) {
          setIsConnected(false);
          setPid(null);
        }
      });

      // Try to connect with a 1 second timeout
      socket.setTimeout(1000);
      socket.connect(port, 'localhost');

      // Schedule next check
      reconnectTimeout = setTimeout(connect, isConnected ? 5000 : 1000);
    }

    // Start checking
    connect();

    // Cleanup on unmount
    return () => {
      isDestroyed = true;
      if (socket) {
        socket.destroy();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [port, isConnected]);

  return (
    <Box>
      {isConnected ? (
        <Text>
          <Text color="green">{figures.circleFilled}</Text> Connected to server
          on port {port}
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
  );
}
