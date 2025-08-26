import type { WebhookType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';
import { useApiStore } from './api-store';
import { useAuthStore } from './auth-store';
import { useConfigStore } from './config-store';

const log = debug('unhook:cli:webhook-store');

interface WebhookState {
  webhooks: WebhookType[];
  isLoading: boolean;
  isAuthorizedForWebhook: boolean;
  isCheckingWebhook: boolean;
}

interface WebhookActions {
  setWebhooks: (webhooks: WebhookType[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAuthorizedForWebhook: (isAuthorized: boolean) => void;
  setIsCheckingWebhook: (isChecking: boolean) => void;
  fetchWebhooks: () => Promise<WebhookType[]>;
  fetchWebhookByUrl: (webhookUrl: string) => Promise<WebhookType | null>;
  createWebhook: (name: string) => Promise<WebhookType>;
  checkWebhookAuth: () => Promise<boolean>;
}

type WebhookStore = WebhookState & WebhookActions;

const defaultWebhookState: WebhookState = {
  isAuthorizedForWebhook: false,
  isCheckingWebhook: true,
  isLoading: true,
  webhooks: [],
};

const store = createStore<WebhookStore>()((set, get) => ({
  ...defaultWebhookState,
  checkWebhookAuth: async () => {
    const { isSignedIn } = useAuthStore.getState();
    const webhookUrl = useConfigStore.getState().webhookUrl;

    log('checkWebhookAuth called', {
      isSignedIn,
      webhookUrl,
    });

    if (!isSignedIn || !webhookUrl || webhookUrl === '') {
      log('checkWebhookAuth - missing required state', {
        isSignedIn,
        webhookUrl,
      });
      set({
        isAuthorizedForWebhook: false,
        isCheckingWebhook: false,
      });
      return false;
    }

    try {
      log('checkWebhookAuth - setting isCheckingWebhook to true');
      set({ isCheckingWebhook: true });
      const webhook = await get().fetchWebhookByUrl(webhookUrl);
      const isAuthorized = !!webhook;
      log('checkWebhookAuth - completed check', {
        isAuthorized,
        webhook: !!webhook,
      });
      set({
        isAuthorizedForWebhook: isAuthorized,
        isCheckingWebhook: false,
      });
      return isAuthorized;
    } catch (error) {
      log('checkWebhookAuth - error during check', { error });
      set({
        isAuthorizedForWebhook: false,
        isCheckingWebhook: false,
      });
      return false;
    }
  },
  createWebhook: async (name: string) => {
    const { user, orgId } = useAuthStore.getState();

    if (!user?.id || !orgId) {
      throw new Error('User must be authenticated to create a webhook');
    }

    const { api } = useApiStore.getState();
    const [apiKey] = await api.apiKeys.all.query();

    if (!apiKey) throw new Error('No API key found');

    const webhook = await api.webhooks.create.mutate({
      apiKeyId: apiKey.id,
      config: {
        headers: {},
        requests: {},
        storage: {
          maxRequestBodySize: 1024 * 1024,
          maxResponseBodySize: 1024 * 1024,
          storeHeaders: true,
          storeRequestBody: true, // 1MB
          storeResponseBody: true, // 1MB
        },
      },
      name,
      status: 'active',
    });

    if (!webhook) throw new Error('Failed to create webhook');

    await get().fetchWebhooks();
    return webhook;
  },
  fetchWebhookByUrl: async (webhookUrl: string) => {
    const { orgId } = useAuthStore.getState();
    const { api } = useApiStore.getState();

    log('fetchWebhookByUrl', { orgId, webhookUrl });

    try {
      const webhook = await api.webhooks.byUrl.query({ url: webhookUrl });

      if (webhook) {
        log('Webhook found, updating store state', { webhookUrl });
        set((state) => ({
          isAuthorizedForWebhook: true,
          isCheckingWebhook: false,
          isLoading: false,
          webhooks: state.webhooks.some((w) => w.id === webhook.id)
            ? state.webhooks.map((w) => (w.id === webhook.id ? webhook : w))
            : [...state.webhooks, webhook],
        }));

        return webhook;
      }

      log('Webhook not found', { webhookUrl });
      set({
        isAuthorizedForWebhook: false,
        isCheckingWebhook: false,
      });
      return null;
    } catch (error) {
      log('Error fetching webhook:', error);
      set({
        isAuthorizedForWebhook: false,
        isCheckingWebhook: false,
      });
      return null;
    }
  },
  fetchWebhooks: async () => {
    const { api } = useApiStore.getState();

    try {
      const webhooks = await api.webhooks.all.query();
      set({
        isLoading: false,
        webhooks,
      });

      return webhooks;
    } catch (error) {
      log('Error fetching webhooks: %O', error);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  setIsAuthorizedForWebhook: (isAuthorized) =>
    set({ isAuthorizedForWebhook: isAuthorized }),
  setIsCheckingWebhook: (isChecking) => set({ isCheckingWebhook: isChecking }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setWebhooks: (webhooks) => set({ webhooks }),
}));

export const useWebhookStore = createSelectors(store);
