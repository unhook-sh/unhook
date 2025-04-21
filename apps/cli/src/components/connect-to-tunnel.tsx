import { useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useConnectionStore } from '~/stores/connection-store';
import { useTunnelStore } from '~/stores/tunnel-store';

export function ConnectToTunnel() {
  const isConnected = useConnectionStore.use.isAnyConnected();
  const connect = useConnectionStore.use.connect();
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const isTokenValid = useAuthStore.use.isTokenValid();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();

  useEffect(() => {
    if (!isConnected && selectedTunnelId && isAuthenticated && isTokenValid) {
      connect();
    }
  }, [isConnected, selectedTunnelId, connect, isAuthenticated, isTokenValid]);

  return null;
}
