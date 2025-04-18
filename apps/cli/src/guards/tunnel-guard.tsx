import { debug } from '@unhook/logger';
import { Box, Text } from 'ink';
import type { PropsWithChildren } from 'react';
import { useTunnelStore } from '~/stores/tunnel-store';

const log = debug('unhook:cli:tunnel-guard');

interface TunnelGuardProps extends PropsWithChildren {
  /**
   * Optional fallback component to show while loading
   */
  fallback?: React.ReactNode;
}

/**
 * Component that renders its children only when a tunnel ID is selected and
 * the user is authorized for the tunnel
 */
export function TunnelAuthorized({ children, fallback }: TunnelGuardProps) {
  const isAuthorizedForTunnel = useTunnelStore.use.isAuthorizedForTunnel();
  const isCheckingTunnel = useTunnelStore.use.isCheckingTunnel();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();

  // First check if a tunnel ID is selected
  if (!selectedTunnelId && !isCheckingTunnel) {
    return (
      fallback ?? (
        <Box>
          <Text>No tunnel selected. Please specify a tunnel ID.</Text>
        </Box>
      )
    );
  }

  // Then check if we're in the process of validating the tunnel
  if (isCheckingTunnel) {
    return (
      fallback ?? (
        <Box>
          <Text>Checking tunnel...</Text>
        </Box>
      )
    );
  }

  // Finally check if the user is authorized for the selected tunnel
  return isAuthorizedForTunnel ? <>{children}</> : null;
}

/**
 * Component that renders its children only when the user is NOT authorized for the tunnel
 */
export function TunnelUnauthorized({ children, fallback }: TunnelGuardProps) {
  const isAuthorizedForTunnel = useTunnelStore.use.isAuthorizedForTunnel();
  const isCheckingTunnel = useTunnelStore.use.isCheckingTunnel();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();

  if (!selectedTunnelId) {
    return null;
  }

  if (isCheckingTunnel) {
    return (
      fallback ?? (
        <Box>
          <Text>Checking tunnel...</Text>
        </Box>
      )
    );
  }

  if (!isAuthorizedForTunnel) {
    log('User is not authorized for tunnel:', selectedTunnelId);
  }

  return !isAuthorizedForTunnel ? <>{children}</> : null;
}

/**
 * Component that renders different content based on tunnel authorization status
 */
export function TunnelGuard({
  children,
  fallback,
  unauthorizedComponent,
}: TunnelGuardProps & {
  /**
   * Component to show when user is not authorized for tunnel
   */
  unauthorizedComponent: React.ReactNode;
}) {
  const isAuthorizedForTunnel = useTunnelStore.use.isAuthorizedForTunnel();
  const isCheckingTunnel = useTunnelStore.use.isCheckingTunnel();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();

  if (!selectedTunnelId) {
    return (
      fallback ?? (
        <Box>
          <Text>No tunnel selected. Please specify a tunnel ID.</Text>
        </Box>
      )
    );
  }

  if (isCheckingTunnel) {
    return (
      fallback ?? (
        <Box>
          <Text>Checking tunnel...</Text>
        </Box>
      )
    );
  }

  return isAuthorizedForTunnel ? <>{children}</> : <>{unauthorizedComponent}</>;
}
