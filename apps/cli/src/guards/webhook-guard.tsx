import { debug } from '@unhook/logger';
import {} from 'ink';
import type { PropsWithChildren } from 'react';
import { useWebhookStore } from '~/stores/webhook-store';

const log = debug('unhook:cli:webhook-guard');

interface WebhookGuardProps extends PropsWithChildren {}

/**
 * Component that renders its children only when a webhook ID is selected and
 * the user is authorized for the webhook
 */
export function WebhookAuthorized({ children }: WebhookGuardProps) {
  const isAuthorizedForWebhook = useWebhookStore.use.isAuthorizedForWebhook();

  // Finally check if the user is authorized for the selected webhook
  return isAuthorizedForWebhook ? <>{children}</> : null;
}

/**
 * Component that renders its children only when the user is NOT authorized for the webhook
 */
export function WebhookUnauthorized({ children }: WebhookGuardProps) {
  const isAuthorizedForWebhook = useWebhookStore.use.isAuthorizedForWebhook();
  const selectedWebhookId = useWebhookStore.use.selectedWebhookId();

  if (!selectedWebhookId) {
    return null;
  }

  if (!isAuthorizedForWebhook) {
    log('User is not authorized for webhook:', selectedWebhookId);
  }

  return !isAuthorizedForWebhook ? <>{children}</> : null;
}
