import type { TunnelConfig } from '@unhook/tunnel/config';
import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';

// Combine base and exclusive properties into the final state type
export type CliState = TunnelConfig & {
  version: string;
  argSources: Record<string, 'cli' | 'config'>;
};

interface CliActions {
  setDebug: (debug: boolean) => void;
  setTunnelId: (tunnelId: string) => void;
  setClientId: (clientId: string) => void;
  setVersion: (version: string) => void;
  setTelemetry: (telemetry: boolean) => void;
  setCliArgs: (args: Partial<CliState>) => void;
  // Getters for TunnelConfig fields
  getForward: () => NonNullable<TunnelConfig['forward']>;
  getFrom: () => NonNullable<TunnelConfig['from']>;
  getTunnelId: () => string;
  getClientId: () => string | undefined;
  getDebug: () => boolean;
  getTelemetry: () => boolean;
  getVersion: () => string;
}

type CliStore = CliState & CliActions;

const defaultCliState: Partial<CliState> = {
  debug: false,
  tunnelId: '',
  clientId: '',
  version: '',
  telemetry: true,
  argSources: {},
  from: [],
  forward: [],
};

const store = createStore<CliStore>()((set, get) => ({
  ...(defaultCliState as CliState),

  // Individual setters remain simple
  setDebug: (debug) => set((state) => ({ ...state, debug })),
  setTunnelId: (tunnelId) => set((state) => ({ ...state, tunnelId })),
  setClientId: (clientId) => set((state) => ({ ...state, clientId })),
  setVersion: (version) => set((state) => ({ ...state, version })),
  setTelemetry: (telemetry) => set((state) => ({ ...state, telemetry })),

  // Getters for TunnelConfig fields
  getForward: () => get().forward,
  getFrom: () => get().from ?? [],
  getTunnelId: () => get().tunnelId,
  getClientId: () => get().clientId,
  getDebug: () => get().debug ?? false,
  getTelemetry: () => get().telemetry ?? true,
  getVersion: () => get().version,

  // setCliArgs needs to carefully merge while respecting the union type.
  // Since input `args` comes from validated sources (yargs/loadConfig),
  // we assume it will lead to a valid state.
  setCliArgs: (args) =>
    set((state) => {
      const newState = { ...state, ...args };
      // Track argument sources
      const argSources = { ...state.argSources };
      for (const key of Object.keys(args)) {
        if (key !== 'argSources') {
          argSources[key] = 'cli';
        }
      }
      newState.argSources = argSources;
      return newState as CliState;
    }),
}));

export const useCliStore = createSelectors(store);
