import { debug } from '@unhook/logger';
import { useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useConfigStore } from '~/stores/config-store';
import { useConnectionStore } from '~/stores/connection-store';

const log = debug('unhook:cli:connect-to-webhook');

export function ConnectToWebhook() {
  const connect = useConnectionStore.use.connect();
  const webhookId = useConfigStore.use.webhookId();
  const isSignedIn = useAuthStore.use.isSignedIn();

  useEffect(() => {
    if (webhookId && isSignedIn) {
      log('Connecting to webhook', { webhookId });
      void connect();
    }
  }, [webhookId, connect, isSignedIn]);

  return null;
}
