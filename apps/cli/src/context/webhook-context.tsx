import { debug } from '@unhook/logger';
import { createContext, useContext, useEffect, useRef } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useConfigStore } from '~/stores/config-store';
import { useWebhookStore } from '~/stores/webhook-store';

const log = debug('unhook:cli:webhook-context');

interface WebhookContextValue {
  webhookId: string | null;
}

const WebhookContext = createContext<WebhookContextValue | null>(null);

interface WebhookProviderProps {
  children: React.ReactNode;
  initialWebhookId?: string | null;
}

export function WebhookProvider({
  children,
  initialWebhookId,
}: WebhookProviderProps) {
  const checkWebhookAuth = useWebhookStore.use.checkWebhookAuth();
  const isAuthorizedForWebhook = useWebhookStore.use.isAuthorizedForWebhook();
  const isCheckingWebhook = useWebhookStore.use.isCheckingWebhook();
  const webhookId = useConfigStore.use.webhookId();
  const isSignedIn = useAuthStore.use.isSignedIn();
  const hasCheckedAuth = useRef(false);
  const isMounted = useRef(false);

  // Log initial mount
  useEffect(() => {
    log('WebhookProvider mounted', {
      initialWebhookId,
      isAuthorizedForWebhook,
      isCheckingWebhook,
      isSignedIn,
      webhookId,
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
    initialWebhookId,
    isSignedIn,
    isAuthorizedForWebhook,
    isCheckingWebhook,
    webhookId,
  ]);

  // Reset hasCheckedAuth when webhook ID changes
  useEffect(() => {
    if (!isMounted.current) return;

    if (webhookId !== initialWebhookId) {
      log('Webhook ID changed, resetting auth check', {
        newWebhookId: webhookId,
        oldWebhookId: initialWebhookId,
      });
      hasCheckedAuth.current = false;
    }
  }, [webhookId, initialWebhookId]);

  // Check webhook authorization when necessary
  useEffect(() => {
    if (!isMounted.current) return;

    log('Checking webhook authorization', {
      hasCheckedAuth: hasCheckedAuth.current,
      isAuthorizedForWebhook,
      isCheckingWebhook,
      isSignedIn,
      webhookId,
    });

    if (
      webhookId &&
      isSignedIn &&
      !isAuthorizedForWebhook &&
      !isCheckingWebhook &&
      !hasCheckedAuth.current
    ) {
      log('Initiating webhook authorization check', {
        webhookId,
      });
      hasCheckedAuth.current = true;
      void checkWebhookAuth().then((isAuthorized) => {
        if (!isMounted.current) return;
        log('Webhook authorization check completed', {
          isAuthorized,
          webhookId,
        });
        if (!isAuthorized) {
          hasCheckedAuth.current = false;
        }
      });
    }
  }, [
    webhookId,
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
      webhookId,
    });
  }, [isSignedIn, isAuthorizedForWebhook, isCheckingWebhook, webhookId]);

  return (
    <WebhookContext.Provider value={{ webhookId }}>
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
