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
  selectedWebhookId: string | null;
  isLoading: boolean;
  isAuthorizedForWebhook: boolean;
  isCheckingWebhook: boolean;
}

interface WebhookActions {
  setWebhooks: (webhooks: WebhookType[]) => void;
  setSelectedWebhookId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAuthorizedForWebhook: (isAuthorized: boolean) => void;
  setIsCheckingWebhook: (isChecking: boolean) => void;
  fetchWebhooks: () => Promise<void>;
  fetchWebhookById: (webhookId: string) => Promise<WebhookType | null>;
  createWebhook: (port: number) => Promise<void>;
  checkWebhookAuth: () => Promise<boolean>;
}

type WebhookStore = WebhookState & WebhookActions;

const defaultWebhookState: WebhookState = {
  webhooks: [],
  selectedWebhookId: null,
  isLoading: true,
  isAuthorizedForWebhook: false,
  isCheckingWebhook: true,
};

const store = createStore<WebhookStore>()((set, get) => ({
  ...defaultWebhookState,
  setWebhooks: (webhooks) => set({ webhooks }),
  setSelectedWebhookId: (id) => set({ selectedWebhookId: id }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsAuthorizedForWebhook: (isAuthorized) =>
    set({ isAuthorizedForWebhook: isAuthorized }),
  setIsCheckingWebhook: (isChecking) => set({ isCheckingWebhook: isChecking }),
  fetchWebhookById: async (id: string) => {
    const { orgId } = useAuthStore.getState();
    const { api } = useApiStore.getState();

    log('fetchWebhookById', { id, orgId });

    const webhook = await api.webhooks.byId.query({ id });

    if (webhook) {
      set((state) => ({
        webhooks: state.webhooks.some((t) => t.id === webhook.id)
          ? state.webhooks.map((t) => (t.id === webhook.id ? webhook : t))
          : [...state.webhooks, webhook],
        selectedWebhookId: webhook.id,
        isLoading: false,
      }));

      return webhook;
    }

    return null;
  },
  fetchWebhooks: async () => {
    const { api } = useApiStore.getState();

    const webhooks = await api.webhooks.all.query();

    set((state) => {
      const selectedWebhookId =
        !state.selectedWebhookId && webhooks.length > 0
          ? (webhooks[0]?.id ?? null)
          : state.selectedWebhookId;

      return {
        webhooks,
        selectedWebhookId,
        isLoading: false,
      };
    });
  },
  checkWebhookAuth: async () => {
    const { isSignedIn } = useAuthStore.getState();
    const { selectedWebhookId } = get();

    log('checkWebhookAuth called', {
      isSignedIn,
      selectedWebhookId,
    });

    if (!isSignedIn || !selectedWebhookId || selectedWebhookId === '') {
      log('checkWebhookAuth - missing required state', {
        isSignedIn,
        selectedWebhookId,
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
      const webhook = await get().fetchWebhookById(selectedWebhookId);
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
  createWebhook: async (port: number) => {
    const { user, orgId } = useAuthStore.getState();
    const { clientId } = useConfigStore.getState();

    if (!user?.id || !orgId) {
      throw new Error('User must be authenticated to create a webhook');
    }

    const { api } = useApiStore.getState();

    await api.webhooks.create.mutate({
      clientId: clientId || 'default',
      port,
      clientCount: 0,
      localConnectionStatus: 'disconnected',
      status: 'inactive',
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

    await get().fetchWebhooks();
  },
}));

export const useWebhookStore = createSelectors(store);
