import { useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useConnectionStore } from '~/stores/connection-store';
import { useWebhookStore } from '~/stores/webhook-store';

export function ConnectToWebhook() {
  const isConnected = useConnectionStore.use.isAnyConnected();
  const connect = useConnectionStore.use.connect();
  const isSignedIn = useAuthStore.use.isSignedIn();
  const selectedWebhookId = useWebhookStore.use.selectedWebhookId();

  useEffect(() => {
    if (!isConnected && selectedWebhookId && isSignedIn) {
      connect();
    }
  }, [isConnected, selectedWebhookId, connect, isSignedIn]);

  return null;
}
