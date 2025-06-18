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
  webhookId?: string;
  source?: string;
  destination?: string;
  configPath?: string;
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
  verbose: false,
  version: '',
  code: undefined,
  command: undefined,
  webhookId: undefined,
  source: undefined,
  destination: undefined,
  configPath: undefined,
};

const store = createStore<CliStore>()((set, get) => ({
  ...(defaultCliState as CliState),

  // Individual setters remain simple
  setVerbose: (verbose) => set((state) => ({ ...state, verbose })),

  // Getters for WebhookConfig fields
  getVerbose: () => get().verbose ?? false,
  getVersion: () => get().version,
  getCommand: () => get().command,

  // Reset method to restore default state
  reset: () => set(defaultCliState as CliState),
  getWebhookId: () => get().webhookId,

  // setCliArgs needs to carefully merge while respecting the union type.
  // Since input `args` comes from validated sources (yargs/loadConfig),
  // we assume it will lead to a valid state.
  setCliArgs: (args) =>
    set((state) => {
      const newState = { ...state, ...args };
      return newState as CliState;
    }),
}));

export const useCliStore = createSelectors(store);
