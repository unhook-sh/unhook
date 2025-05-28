import { debug } from '@unhook/logger';
import type { FC } from 'react';
import { useConfigStore } from '~/stores/config-store';
import { useWebhookStore } from '~/stores/webhook-store';

const log = debug('unhook:cli:webhook-guard');

interface WebhookAuthorizedProps {
  children: React.ReactNode;
}

/**
 * Component that renders its children only when a webhook ID is selected and
 * the user is authorized for the webhook
 */
export const WebhookAuthorized: FC<WebhookAuthorizedProps> = ({ children }) => {
  const isAuthorizedForWebhook = useWebhookStore.use.isAuthorizedForWebhook();
  const isCheckingWebhook = useWebhookStore.use.isCheckingWebhook();
  const webhookId = useConfigStore.use.webhookId();

  log('WebhookAuthorized render', {
    isAuthorizedForWebhook,
    isCheckingWebhook,
    webhookId,
  });

  if (!webhookId || isCheckingWebhook || !isAuthorizedForWebhook) {
    log('WebhookAuthorized - not rendering children', {
      reason: !webhookId
        ? 'no webhook ID'
        : isCheckingWebhook
          ? 'checking webhook'
          : 'not authorized',
      webhookId,
      isCheckingWebhook,
      isAuthorizedForWebhook,
    });
    return null;
  }

  return <>{children}</>;
};

interface WebhookUnauthorizedProps {
  children: React.ReactNode;
}

/**
 * Component that renders its children only when the user is NOT authorized for the webhook
 */
export const WebhookUnauthorized: FC<WebhookUnauthorizedProps> = ({
  children,
}) => {
  const isAuthorizedForWebhook = useWebhookStore.use.isAuthorizedForWebhook();
  const isCheckingWebhook = useWebhookStore.use.isCheckingWebhook();
  const webhookId = useConfigStore.use.webhookId();

  log('WebhookUnauthorized render', {
    isAuthorizedForWebhook,
    webhookId,
  });

  if (isCheckingWebhook) {
    log('WebhookUnauthorized - not rendering children', {
      reason: 'checking webhook',
      webhookId,
    });
    return null;
  }

  if (!webhookId) {
    log('WebhookUnauthorized - not rendering children', {
      reason: 'no webhook ID',
      webhookId,
    });
    return null;
  }

  if (isAuthorizedForWebhook) {
    log('User is not authorized for webhook:', webhookId);
    return null;
  }

  return <>{children}</>;
};

interface WebhookCheckingProps {
  children: React.ReactNode;
}

/**
 * Component that renders its children only when the webhook check is in progress
 */
export const WebhookChecking: FC<WebhookCheckingProps> = ({ children }) => {
  const isCheckingWebhook = useWebhookStore.use.isCheckingWebhook();
  const webhookId = useConfigStore.use.webhookId();

  log('WebhookChecking render', {
    isCheckingWebhook,
    webhookId,
  });

  if (!webhookId || !isCheckingWebhook) {
    log('WebhookChecking - not rendering children', {
      reason: !webhookId ? 'no webhook ID' : 'not checking webhook',
      webhookId,
      isCheckingWebhook,
    });
    return null;
  }

  return <>{children}</>;
};
