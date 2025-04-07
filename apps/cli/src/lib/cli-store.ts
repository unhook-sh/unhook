import { createStore } from 'zustand';
import { createSelectors } from './zustand-create-selectors';

interface CliState {
  port: number;
  debug: boolean;
  apiKey: string;
  clientId: string;
  version: string;
}

interface CliActions {
  setPort: (port: number) => void;
  setDebug: (debug: boolean) => void;
  setApiKey: (apiKey: string) => void;
  setClientId: (clientId: string) => void;
  setVersion: (version: string) => void;
  setCliArgs: (args: Partial<CliState>) => void;
}

type CliStore = CliState & CliActions;

const defaultCliState: CliState = {
  port: 3000,
  debug: false,
  apiKey: '',
  clientId: '',
  version: '',
};

const store = createStore<CliStore>()((set) => ({
  ...defaultCliState,
  setPort: (port) => set({ port }),
  setDebug: (debug) => set({ debug }),
  setApiKey: (apiKey) => set({ apiKey }),
  setClientId: (clientId) => set({ clientId }),
  setVersion: (version) => set({ version }),
  setCliArgs: (args) => set((state) => ({ ...state, ...args })),
}));

export const useCliStore = createSelectors(store);
