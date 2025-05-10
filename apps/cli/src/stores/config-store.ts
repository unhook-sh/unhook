import type { WebhookConfig } from '@unhook/webhook/config';
import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';

// Default state matching WebhookConfig shape
const defaultConfigState: WebhookConfig = {
  webhookId: '',
  to: [],
  forward: [],
  debug: false,
  telemetry: true,
};

interface ConfigActions {
  setConfig: (config: Partial<WebhookConfig>) => void;
  getConfig: () => WebhookConfig;
}

type ConfigStore = WebhookConfig & ConfigActions;

const store = createStore<ConfigStore>()((set, get) => ({
  ...defaultConfigState,

  setConfig: (config) => set((state) => ({ ...state, ...config })),
  getConfig: () => get(),
}));

export const useConfigStore = createSelectors(store);
