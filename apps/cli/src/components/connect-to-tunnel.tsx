import { useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useConnectionStore } from '~/stores/connection-store';
import { useTunnelStore } from '~/stores/tunnel-store';

export function ConnectToTunnel() {
  const isConnected = useConnectionStore.use.isAnyConnected();
  const connect = useConnectionStore.use.connect();
  const isSignedIn = useAuthStore.use.isSignedIn();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();

  useEffect(() => {
    if (!isConnected && selectedTunnelId && isSignedIn) {
      connect();
    }
  }, [isConnected, selectedTunnelId, connect, isSignedIn]);

  return null;
}
