import { debug } from '@unhook/logger';
import { type FC, useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useTunnelStore } from '~/stores/tunnel-store';

const log = debug('unhook:cli:tunnel-context');

interface TunnelProviderProps {
  children: React.ReactNode;
  initialTunnelId: string;
}

export const TunnelProvider: FC<TunnelProviderProps> = ({
  children,
  initialTunnelId,
}) => {
  const setSelectedTunnelId = useTunnelStore.use.setSelectedTunnelId();
  const tunnelId = useTunnelStore.use.selectedTunnelId();
  const checkTunnelAuth = useTunnelStore.use.checkTunnelAuth();
  const isSignedIn = useAuthStore.use.isSignedIn();

  // Set the tunnel ID directly from props
  useEffect(() => {
    log('Setting tunnel ID directly from props:', initialTunnelId);
    if (initialTunnelId && initialTunnelId !== '') {
      setSelectedTunnelId(initialTunnelId);
    }
  }, [initialTunnelId, setSelectedTunnelId]);

  // Then check auth when we have what we need
  useEffect(() => {
    log('TunnelProvider checking auth with', {
      tunnelId,
      isSignedIn,
    });
    if (tunnelId && isSignedIn) {
      log('Effect-based auth check triggered');
      checkTunnelAuth().catch((error) => {
        log('Failed to check tunnel auth:', error);
      });
    }
  }, [tunnelId, isSignedIn, checkTunnelAuth]);

  return <>{children}</>;
};
