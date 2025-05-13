import { writeFile } from 'node:fs/promises';
import { debug } from '@unhook/logger';
import type { WebhookConfig } from '@unhook/webhook/config';
import { findUpConfig, loadConfig } from '@unhook/webhook/config';
import { createSelectors } from '@unhook/zustand';
import { watch } from 'chokidar';
import { createStore } from 'zustand';

const log = debug('unhook:cli:config-store');

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
  watchConfig: () => Promise<void>;
  writeConfig: (config: WebhookConfig) => Promise<void>;
  loadConfig: () => Promise<WebhookConfig>;
}

type ConfigStore = WebhookConfig & ConfigActions;

const store = createStore<ConfigStore>()((set, get) => ({
  ...defaultConfigState,

  setConfig: (config) => set((state) => ({ ...state, ...config })),
  getConfig: () => get(),
  loadConfig: async () => {
    try {
      const configPath = await findUpConfig();
      const config = await loadConfig(configPath);
      set(config);
      return defaultConfigState;
    } catch (error) {
      log('Error loading config:', error);
      return defaultConfigState;
    }
  },

  watchConfig: async () => {
    // Initial load
    const configPath = await findUpConfig();

    const watcher = watch(configPath, {
      ignoreInitial: true,
    });

    watcher.on('change', async () => {
      try {
        log('Reloading config');
        const config = await loadConfig(configPath);
        set(config);
      } catch (error) {
        log('Error reloading config:', error);
      }
    });
  },

  writeConfig: async (config: WebhookConfig) => {
    const configPath = await findUpConfig();
    const tsContent = `import { defineWebhookConfig } from '@unhook/cli';

const config = defineWebhookConfig({
  webhookId: '${config.webhookId}',
  to: ${JSON.stringify(config.to, null, 2)},
  forward: ${JSON.stringify(config.forward, null, 2)},
} as const);

export default config;
`;
    try {
      await writeFile(configPath, tsContent);
    } catch (error) {
      log('Error writing config:', error);
      throw error;
    }
  },
}));

export const useConfigStore = createSelectors(store);
