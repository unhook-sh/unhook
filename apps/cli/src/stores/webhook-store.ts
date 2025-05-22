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
  webhooks: [],
  isLoading: true,
  isAuthorizedForWebhook: false,
  isCheckingWebhook: true,
};

const store = createStore<WebhookStore>()((set, get) => ({
  ...defaultWebhookState,
  setWebhooks: (webhooks) => set({ webhooks }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsAuthorizedForWebhook: (isAuthorized) =>
    set({ isAuthorizedForWebhook: isAuthorized }),
  setIsCheckingWebhook: (isChecking) => set({ isCheckingWebhook: isChecking }),
  fetchWebhookById: async (id: string) => {
    const { orgId } = useAuthStore.getState();
    const { api } = useApiStore.getState();

    log('fetchWebhookById', { id, orgId });

    try {
      const webhook = await api.webhooks.byId.query({ id });

      if (webhook) {
        log('Webhook found, updating store state', { webhookId: webhook.id });
        set((state) => ({
          webhooks: state.webhooks.some((t) => t.id === webhook.id)
            ? state.webhooks.map((t) => (t.id === webhook.id ? webhook : t))
            : [...state.webhooks, webhook],
          isLoading: false,
          isAuthorizedForWebhook: true,
          isCheckingWebhook: false,
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
        webhooks,
        isLoading: false,
      });

      return webhooks;
    } catch (error) {
      log('Error fetching webhooks: %O', error);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
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

    const webhook = await api.webhooks.create.mutate({
      name,
      status: 'active',
      config: {
        storage: {
          storeHeaders: true,
          storeRequestBody: true,
          storeResponseBody: true,
          maxRequestBodySize: 1024 * 1024, // 1MB
          maxResponseBodySize: 1024 * 1024, // 1MB
        },
        headers: {},
        requests: {},
      },
    });

    if (!webhook) throw new Error('Failed to create webhook');

    await get().fetchWebhooks();
    return webhook;
  },
}));

export const useWebhookStore = createSelectors(store);
