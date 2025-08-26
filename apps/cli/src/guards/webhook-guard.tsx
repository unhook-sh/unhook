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
  const webhookUrl = useConfigStore.use.webhookUrl();

  log('WebhookAuthorized render', {
    isAuthorizedForWebhook,
    isCheckingWebhook,
    webhookUrl,
  });

  if (!webhookUrl || isCheckingWebhook || !isAuthorizedForWebhook) {
    log('WebhookAuthorized - not rendering children', {
      isAuthorizedForWebhook,
      isCheckingWebhook,
      reason: !webhookUrl
        ? 'no webhook URL'
        : isCheckingWebhook
          ? 'checking webhook'
          : 'not authorized',
      webhookUrl,
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
  const webhookUrl = useConfigStore.use.webhookUrl();

  log('WebhookUnauthorized render', {
    isAuthorizedForWebhook,
    webhookUrl,
  });

  if (isCheckingWebhook) {
    log('WebhookUnauthorized - not rendering children', {
      reason: 'checking webhook',
      webhookUrl,
    });
    return null;
  }

  if (!webhookUrl) {
    log('WebhookUnauthorized - not rendering children', {
      reason: 'no webhook URL',
      webhookUrl,
    });
    return null;
  }

  if (isAuthorizedForWebhook) {
    log('User is not authorized for webhook:', webhookUrl);
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
  const webhookUrl = useConfigStore.use.webhookUrl();

  log('WebhookChecking render', {
    isCheckingWebhook,
    webhookUrl,
  });

  if (!webhookUrl || !isCheckingWebhook) {
    log('WebhookChecking - not rendering children', {
      isCheckingWebhook,
      reason: !webhookUrl ? 'no webhook URL' : 'not checking webhook',
      webhookUrl,
    });
    return null;
  }

  return <>{children}</>;
};
