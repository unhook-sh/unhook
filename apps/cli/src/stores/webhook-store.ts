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
  fetchWebhookById: (webhookId: string) => Promise<WebhookType | null>;
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
    const { webhookId } = useConfigStore.getState();

    log('checkWebhookAuth called', {
      isSignedIn,
      webhookId,
    });

    if (!isSignedIn || !webhookId || webhookId === '') {
      log('checkWebhookAuth - missing required state', {
        isSignedIn,
        webhookId,
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
      const webhook = await get().fetchWebhookById(webhookId);
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
  fetchWebhookById: async (id: string) => {
    const { orgId } = useAuthStore.getState();
    const { api } = useApiStore.getState();

    log('fetchWebhookById', { id, orgId });

    try {
      const webhook = await api.webhooks.byId.query({ id });

      if (webhook) {
        log('Webhook found, updating store state', { webhookId: webhook.id });
        set((state) => ({
          isAuthorizedForWebhook: true,
          isCheckingWebhook: false,
          isLoading: false,
          webhooks: state.webhooks.some((t) => t.id === webhook.id)
            ? state.webhooks.map((t) => (t.id === webhook.id ? webhook : t))
            : [...state.webhooks, webhook],
        }));

        return webhook;
      }

      log('Webhook not found', { id });
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
