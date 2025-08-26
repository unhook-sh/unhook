import { debug } from '@unhook/logger';
import { createContext, useContext, useEffect, useRef } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useConfigStore } from '~/stores/config-store';
import { useWebhookStore } from '~/stores/webhook-store';

const log = debug('unhook:cli:webhook-context');

interface WebhookContextValue {
  webhookUrl: string | null;
}

const WebhookContext = createContext<WebhookContextValue | null>(null);

interface WebhookProviderProps {
  children: React.ReactNode;
  initialWebhookUrl?: string | null;
}

export function WebhookProvider({
  children,
  initialWebhookUrl,
}: WebhookProviderProps) {
  const checkWebhookAuth = useWebhookStore.use.checkWebhookAuth();
  const isAuthorizedForWebhook = useWebhookStore.use.isAuthorizedForWebhook();
  const isCheckingWebhook = useWebhookStore.use.isCheckingWebhook();
  const webhookUrl = useConfigStore.use.webhookUrl();
  const isSignedIn = useAuthStore.use.isSignedIn();
  const hasCheckedAuth = useRef(false);
  const isMounted = useRef(false);

  // Log initial mount
  useEffect(() => {
    log('WebhookProvider mounted', {
      initialWebhookUrl,
      isAuthorizedForWebhook,
      isCheckingWebhook,
      isSignedIn,
      webhookUrl,
    });
    isMounted.current = true;

    // Reset checking state if we're stuck in checking
    if (isCheckingWebhook) {
      log('Resetting stuck checking state');
      useWebhookStore.getState().setIsCheckingWebhook(false);
    }

    return () => {
      log('WebhookProvider unmounting');
      isMounted.current = false;
    };
  }, [
    initialWebhookUrl,
    isSignedIn,
    isAuthorizedForWebhook,
    isCheckingWebhook,
    webhookUrl,
  ]);

  // Reset hasCheckedAuth when webhook ID changes
  useEffect(() => {
    if (!isMounted.current) return;

    if (webhookUrl !== initialWebhookUrl) {
      log('Webhook URL changed, resetting auth check', {
        newWebhookUrl: webhookUrl,
        oldWebhookUrl: initialWebhookUrl,
      });
      hasCheckedAuth.current = false;
    }
  }, [webhookUrl, initialWebhookUrl]);

  // Check webhook authorization when necessary
  useEffect(() => {
    if (!isMounted.current) return;

    log('Checking webhook authorization', {
      hasCheckedAuth: hasCheckedAuth.current,
      isAuthorizedForWebhook,
      isCheckingWebhook,
      isSignedIn,
      webhookUrl,
    });

    if (
      webhookUrl &&
      isSignedIn &&
      !isAuthorizedForWebhook &&
      !isCheckingWebhook &&
      !hasCheckedAuth.current
    ) {
      log('Initiating webhook authorization check', {
        webhookUrl,
      });
      hasCheckedAuth.current = true;
      void checkWebhookAuth().then((isAuthorized) => {
        if (!isMounted.current) return;
        log('Webhook authorization check completed', {
          isAuthorized,
          webhookUrl,
        });
        if (!isAuthorized) {
          hasCheckedAuth.current = false;
        }
      });
    }
  }, [
    webhookUrl,
    isSignedIn,
    isAuthorizedForWebhook,
    isCheckingWebhook,
    checkWebhookAuth,
  ]);

  // Log state changes
  useEffect(() => {
    if (!isMounted.current) return;

    log('WebhookProvider state changed', {
      hasCheckedAuth: hasCheckedAuth.current,
      isAuthorizedForWebhook,
      isCheckingWebhook,
      isSignedIn,
      webhookUrl,
    });
  }, [isSignedIn, isAuthorizedForWebhook, isCheckingWebhook, webhookUrl]);

  return (
    <WebhookContext.Provider value={{ webhookUrl }}>
      {children}
    </WebhookContext.Provider>
  );
}

export function useWebhook() {
  const context = useContext(WebhookContext);
  if (!context) {
    throw new Error('useWebhook must be used within a WebhookProvider');
  }
  return context;
}
