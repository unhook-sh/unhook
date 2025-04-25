import { debug } from '@unhook/logger';
import {} from 'ink';
import type { PropsWithChildren } from 'react';
import { useTunnelStore } from '~/stores/tunnel-store';

const log = debug('unhook:cli:tunnel-guard');

interface TunnelGuardProps extends PropsWithChildren {}

/**
 * Component that renders its children only when a tunnel ID is selected and
 * the user is authorized for the tunnel
 */
export function TunnelAuthorized({ children }: TunnelGuardProps) {
  const isAuthorizedForTunnel = useTunnelStore.use.isAuthorizedForTunnel();

  // Finally check if the user is authorized for the selected tunnel
  return isAuthorizedForTunnel ? <>{children}</> : null;
}

/**
 * Component that renders its children only when the user is NOT authorized for the tunnel
 */
export function TunnelUnauthorized({ children }: TunnelGuardProps) {
  const isAuthorizedForTunnel = useTunnelStore.use.isAuthorizedForTunnel();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();

  if (!selectedTunnelId) {
    return null;
  }

  if (!isAuthorizedForTunnel) {
    log('User is not authorized for tunnel:', selectedTunnelId);
  }

  return !isAuthorizedForTunnel ? <>{children}</> : null;
}
