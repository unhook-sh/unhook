import { useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useCliStore } from '~/stores/cli-store';
import { useConnectionStore } from '~/stores/connection-store';
import { useTunnelStore } from '~/stores/tunnel-store';

export function ConnectToTunnel() {
  const isConnected = useConnectionStore.use.isConnected();
  const connect = useConnectionStore.use.connect();
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const isTokenValid = useAuthStore.use.isTokenValid();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();
  const pingEnabled = useCliStore.use.ping() !== false;

  useEffect(() => {
    if (
      !isConnected &&
      selectedTunnelId &&
      isAuthenticated &&
      isTokenValid &&
      pingEnabled
    ) {
      connect();
    }
  }, [
    isConnected,
    selectedTunnelId,
    connect,
    isAuthenticated,
    isTokenValid,
    pingEnabled,
  ]);

  return null;
}
