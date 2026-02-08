import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import Path from 'node:path';
import type { WebhookConfig } from '@unhook/client/config';
import { findUpConfig, loadConfig } from '@unhook/client/config';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { watch } from 'chokidar';
import { findUp } from 'find-up';
import yaml from 'js-yaml';
import { createStore } from 'zustand';

const log = debug('unhook:cli:config-store');

// Default state matching WebhookConfig shape
const defaultConfigState: WebhookConfig = {
  debug: false,
  delivery: [],
  telemetry: true,
  webhookUrl: '',
};

interface ConfigActions {
  setConfig: (config: Partial<WebhookConfig>) => void;
  getConfig: () => WebhookConfig;
  watchConfig: () => Promise<void>;
  writeConfig: (config: WebhookConfig) => Promise<{ path?: string }>;
  loadConfig: () => Promise<WebhookConfig>;
  getWebhookUrl: () => string;
}

type ConfigStore = WebhookConfig & ConfigActions;

const store = createStore<ConfigStore>()((set, get) => ({
  ...defaultConfigState,
  getConfig: () => get(),
  getWebhookUrl: () => get().webhookUrl,
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
      return config;
    } catch (error) {
      log('Error loading config:', error);
      return defaultConfigState;
    }
  },

  setConfig: (config) => set((state) => ({ ...state, ...config })),

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
    let configPath = await findUpConfig();
    let isTypeScriptConfig = false;

    // If we found a config path, check its extension
    if (configPath) {
      isTypeScriptConfig = configPath.endsWith('.ts');
    } else {
      // If no config found, determine format based on CLI installation
      isTypeScriptConfig = hasCliInstalled;
      configPath = Path.resolve(
        process.cwd(),
        isTypeScriptConfig ? 'unhook.ts' : 'unhook.yaml',
      );
    }

    // If CLI is not installed but we found a TypeScript config, we should convert to YAML
    if (!hasCliInstalled && isTypeScriptConfig) {
      isTypeScriptConfig = false;
      configPath = Path.resolve(process.cwd(), 'unhook.yaml');
    }

    if (isTypeScriptConfig) {
      content = `/**
 * Unhook Webhook Configuration
 *
 * This file defines the configuration for your Unhook webhook.
 * For more information, visit: https://docs.unhook.sh/configuration
 *
 * @property {string} webhookUrl - Full webhook URL (e.g., https://unhook.sh/my-org/my-webhook)
 * @property {Array} delivery - Array of delivery rules
 *   @property {string} delivery[].destination - URL to forward webhooks to
 *   @property {string} [delivery[].source] - Source filter (default: "*" = all)
 *   @property {string} [delivery[].name] - Optional label for this rule
 *   @property {string} [delivery[].eventTypeField] - Custom field name for event type (e.g., "resourceType")
 *   @property {boolean} [delivery[].ping] - Enable ping checks (default: true)
 */

import { defineWebhookConfig } from '@unhook/cli';

const config = defineWebhookConfig({
  webhookUrl: '${config.webhookUrl}',
  delivery: ${JSON.stringify(config.delivery, null, 2)},
} as const);

export default config;
`;
    } else {
      // Use YAML format if not TypeScript
      const yamlConfig = {
        delivery: config.delivery,
        webhookUrl: config.webhookUrl,
      };
      content = `# Unhook Webhook Configuration
# For more information, visit: https://docs.unhook.sh/configuration
#
# Schema:
#   webhookUrl: string                   # Full webhook URL (e.g., https://unhook.sh/my-org/my-webhook)
#   delivery:                            # Array of delivery rules
#     - destination: string              # URL to forward webhooks to
#       source?: string                  # Optional source filter (default: "*" = all)
#       name?: string                    # Optional label for this rule
#       eventTypeField?: string          # Custom field name for event type (e.g., "resourceType")
#       ping?: boolean                   # Enable ping checks (default: true)

${yaml.dump(yamlConfig, {
  indent: 2,
  lineWidth: -1, // No line wrapping
  noRefs: true, // Don't use YAML references
  quotingType: '"', // Use double quotes for strings
})}`;
    }

    try {
      if (!configPath) {
        log('No config file found to write.');
        return { path: undefined };
      }
      await writeFile(configPath, content);
      set(config);

      return { path: configPath };
    } catch (error) {
      log('Error writing config:', error);
      throw error;
    }
  },
}));

export const useConfigStore = createSelectors(store);
