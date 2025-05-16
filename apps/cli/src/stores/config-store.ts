import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import Path from 'node:path';
import { debug } from '@unhook/logger';
import type { WebhookConfig } from '@unhook/webhook/config';
import { findUpConfig, loadConfig } from '@unhook/webhook/config';
import { createSelectors } from '@unhook/zustand';
import { watch } from 'chokidar';
import { findUp } from 'find-up';
import yaml from 'js-yaml';
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
      if (!configPath) {
        log('No config file found');
        return defaultConfigState;
      }
      log('Loading config from:', configPath);
      const config = await loadConfig(configPath);
      log('Loaded config:', config);
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
    // TODO: make this so we can pass in all the config paths and watch them all
    if (!configPath) {
      log('No config file found to watch.');
      return;
    }

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
    // Check if @unhook/cli is installed by looking in package.json
    const packageJsonPath = await findUp('package.json');
    let hasCliInstalled = false;

    if (packageJsonPath) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
        hasCliInstalled = '@unhook/cli' in deps;
      } catch (error) {
        log('Error reading package.json:', error);
      }
    }

    let content: string;
    if (hasCliInstalled) {
      content = `/**
 * Unhook Webhook Configuration
 *
 * This file defines the configuration for your Unhook webhook.
 * For more information, visit: https://docs.unhook.sh/configuration
 *
 * @property {string} webhookId - Unique identifier for your webhook
 * @property {Array<{name: string, url: string|URL|RemotePattern, ping?: boolean|string|URL|RemotePattern}>} to - Array of destination endpoints
 * @property {Array<{from?: string, to: string}>} forward - Array of forwarding rules

 * @typedef {Object} RemotePattern
 * @property {'http'|'https'} [protocol] - URL protocol
 * @property {string} hostname - URL hostname
 * @property {string} [port] - URL port
 * @property {string} [pathname] - URL pathname
 * @property {string} [search] - URL search params
 */

import { defineWebhookConfig } from '@unhook/cli';

const config = defineWebhookConfig({
  webhookId: '${config.webhookId}',
  to: ${JSON.stringify(config.to, null, 2)},
  forward: ${JSON.stringify(config.forward, null, 2)},
} as const);

export default config;
`;
    } else {
      // Use YAML format if @unhook/cli is not installed
      const yamlConfig = {
        webhookId: config.webhookId,
        to: config.to,
        forward: config.forward,
      };
      content = `# Unhook Webhook Configuration
# For more information, visit: https://docs.unhook.sh/configuration

${yaml.dump(yamlConfig, {
  indent: 2,
  lineWidth: -1, // No line wrapping
  noRefs: true, // Don't use YAML references
  quotingType: '"', // Use double quotes for strings
})}`;
    }

    try {
      let configPath = await findUpConfig();

      if (!configPath && !hasCliInstalled) {
        configPath = Path.resolve(process.cwd(), 'unhook.config.yaml');
      }

      if (!configPath && hasCliInstalled) {
        configPath = Path.resolve(process.cwd(), 'unhook.config.ts');
      }

      if (!configPath) {
        log('No config file found to write.');
        return;
      }
      await writeFile(configPath, content);
    } catch (error) {
      log('Error writing config:', error);
      throw error;
    }
  },
}));

export const useConfigStore = createSelectors(store);
