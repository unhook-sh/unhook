import { Box, Text } from 'ink';
import type { PropsWithChildren } from 'react';
import { useConnectionStore } from '~/stores/connection-store';

interface ConnectionGuardProps extends PropsWithChildren {
  /**
   * Optional fallback component to show while connecting
   */
  fallback?: React.ReactNode;
}

/**
 * Component that renders its children only when the connection is established
 */
export function Connected({ children, fallback }: ConnectionGuardProps) {
  const isConnected = useConnectionStore.use.isAnyConnected();
  const isLoading = useConnectionStore.use.isLoading();

  if (isLoading) {
    return (
      fallback ?? (
        <Box>
          <Text>Connecting to Unhook server...</Text>
        </Box>
      )
    );
  }

  return isConnected ? children : null;
}

/**
 * Component that renders its children only when not connected
 */
export function Disconnected({ children, fallback }: ConnectionGuardProps) {
  const isConnected = useConnectionStore.use.isAnyConnected();
  const isLoading = useConnectionStore.use.isLoading();

  if (isLoading) {
    return (
      fallback ?? (
        <Box>
          <Text>Connecting to Unhook server...</Text>
        </Box>
      )
    );
  }

  return !isConnected ? children : null;
}

/**
 * Component that renders different content based on connection status
 */
export function ConnectionGuard({
  children,
  fallback,
  disconnectedComponent,
}: ConnectionGuardProps & {
  /**
   * Component to show when disconnected
   */
  disconnectedComponent: React.ReactNode;
}) {
  const isConnected = useConnectionStore.use.isAnyConnected();
  const isLoading = useConnectionStore.use.isLoading();

  if (isLoading) {
    return (
      fallback ?? (
        <Box>
          <Text>Connecting to Unhook server...</Text>
        </Box>
      )
    );
  }

  return isConnected ? children : disconnectedComponent;
}
