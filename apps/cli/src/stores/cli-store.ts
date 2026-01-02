import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';
import type { AppRoutePath } from '~/app/routes';

// Combine base and exclusive properties into the final state type
export type CliState = {
  version: string;
  verbose: boolean;
  code?: string;
  command?: AppRoutePath;
  path?: string;
  webhookUrl?: string;
  source?: string;
  destination?: string;
  configPath?: string;
  nonInteractive?: boolean;
  apiKey?: string;
};

interface CliActions {
  setVerbose: (verbose: boolean) => void;
  setCliArgs: (args: Partial<CliState>) => void;
  getVerbose: () => boolean;
  getVersion: () => string;
  reset: () => void;
}

type CliStore = CliState & CliActions;

const defaultCliState: Partial<CliState> = {
  apiKey: undefined,
  code: undefined,
  command: undefined,
  configPath: undefined,
  destination: undefined,
  nonInteractive: false,
  source: undefined,
  verbose: false,
  version: '',
  webhookUrl: undefined,
};

const store = createStore<CliStore>()((set, get) => ({
  ...(defaultCliState as CliState),
  getCommand: () => get().command,

  // Getters for WebhookConfig fields
  getVerbose: () => get().verbose ?? false,
  getVersion: () => get().version,

  getWebhookUrl: () => get().webhookUrl,

  // Reset method to restore default state
  reset: () => set(defaultCliState as CliState),

  // setCliArgs needs to carefully merge while respecting the union type.
  // Since input `args` comes from validated sources (yargs/loadConfig),
  // we assume it will lead to a valid state.
  setCliArgs: (args) =>
    set((state) => {
      const newState = { ...state, ...args };
      return newState as CliState;
    }),

  // Individual setters remain simple
  setVerbose: (verbose) => set((state) => ({ ...state, verbose })),
}));

export const useCliStore = createSelectors(store);
