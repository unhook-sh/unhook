import type { TunnelConfig } from '@unhook/tunnel/config';
import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';

// Default state matching TunnelConfig shape
const defaultConfigState: TunnelConfig = {
  tunnelId: '',
  to: [],
  forward: [],
  debug: false,
  telemetry: true,
};

interface ConfigActions {
  setConfig: (config: Partial<TunnelConfig>) => void;
  getConfig: () => TunnelConfig;
}

type ConfigStore = TunnelConfig & ConfigActions;

const store = createStore<ConfigStore>()((set, get) => ({
  ...defaultConfigState,

  setConfig: (config) => set((state) => ({ ...state, ...config })),
  getConfig: () => get(),
}));

export const useConfigStore = createSelectors(store);
