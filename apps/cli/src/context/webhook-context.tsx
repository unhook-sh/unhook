import { debug } from '@unhook/logger';
import { type FC, useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useWebhookStore } from '~/stores/webhook-store';

const log = debug('unhook:cli:webhook-context');

interface WebhookProviderProps {
  children: React.ReactNode;
  initialWebhookId: string;
}

export const WebhookProvider: FC<WebhookProviderProps> = ({
  children,
  initialWebhookId,
}) => {
  const setSelectedWebhookId = useWebhookStore.use.setSelectedWebhookId();
  const webhookId = useWebhookStore.use.selectedWebhookId();
  const checkWebhookAuth = useWebhookStore.use.checkWebhookAuth();
  const isSignedIn = useAuthStore.use.isSignedIn();

  // Set the webhook ID directly from props
  useEffect(() => {
    log('Setting webhook ID directly from props:', initialWebhookId);
    if (initialWebhookId && initialWebhookId !== '') {
      setSelectedWebhookId(initialWebhookId);
    }
  }, [initialWebhookId, setSelectedWebhookId]);

  // Then check auth when we have what we need
  useEffect(() => {
    log('WebhookProvider checking auth with', {
      webhookId,
      isSignedIn,
    });
    if (webhookId && isSignedIn) {
      log('Effect-based auth check triggered');
      checkWebhookAuth().catch((error) => {
        log('Failed to check webhook auth:', error);
      });
    }
  }, [webhookId, isSignedIn, checkWebhookAuth]);

  return <>{children}</>;
};
