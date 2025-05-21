import type { WebhookType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';
import { useApiStore } from './api-store';
import { useAuthStore } from './auth-store';

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
  fetchWebhooks: () => Promise<WebhookType[]>;
  fetchWebhookById: (webhookId: string) => Promise<WebhookType | null>;
  createWebhook: (name: string) => Promise<WebhookType>;
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

    try {
      const webhooks = await api.webhooks.all.query();
      const selectedWebhookId =
        !get().selectedWebhookId && webhooks.length > 0
          ? (webhooks[0]?.id ?? null)
          : get().selectedWebhookId;

      set({
        webhooks,
        selectedWebhookId,
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
