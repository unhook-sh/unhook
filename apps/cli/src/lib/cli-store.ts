import { createStore } from 'zustand';
import { createSelectors } from './zustand-create-selectors';

// Define the base properties common to all configurations
interface CliStateBase {
  debug: boolean;
  apiKey: string;
  clientId: string;
  version: string;
  ping: boolean | string | number;
}

// Define the mutually exclusive properties
type CliStateExclusive =
  | { port: number; redirect?: never } // Port is provided, redirect is not
  | { port?: never; redirect: string }; // Redirect is provided, port is not

// Combine base and exclusive properties into the final state type
export type CliState = CliStateBase & CliStateExclusive;

interface CliActions {
  setPort: (port?: number) => void;
  setDebug: (debug: boolean) => void;
  setApiKey: (apiKey: string) => void;
  setClientId: (clientId: string) => void;
  setRedirect: (redirect?: string) => void;
  setVersion: (version: string) => void;
  setPing: (ping: boolean | string | number) => void;
  setCliArgs: (args: Partial<CliState>) => void;
}

// type CliStore = CliState & CliActions;
// Combine state and actions using intersection for Zustand
type CliStore = CliState & CliActions;

// Default state represents the initial state *before* args are parsed.
// It needs default values for base properties but doesn't enforce the exclusive part yet.
// We use a Partial<CliState> and cast where needed, acknowledging validation happens externally.
const defaultCliState: Partial<CliStateBase> & {
  port?: number;
  redirect?: string;
} = {
  port: undefined,
  debug: false, // Provide a default boolean
  apiKey: '', // Provide default string
  clientId: '', // Provide default string
  redirect: undefined,
  version: '', // Provide default string
  ping: true, // Default ping to true
};

const store = createStore<CliStore>()((set) => ({
  ...(defaultCliState as CliState), // Initial state needs assertion due to union type

  // Individual setters remain simple
  setPort: (port) => set({ port }),
  setDebug: (debug) => set({ debug }),
  setApiKey: (apiKey) => set({ apiKey }),
  setClientId: (clientId) => set({ clientId }),
  setRedirect: (redirect) => set({ redirect }),
  setVersion: (version) => set({ version }),
  setPing: (ping) => set({ ping }),

  // setCliArgs needs to carefully merge while respecting the union type.
  // Since input `args` comes from validated sources (yargs/loadConfig),
  // we assume it will lead to a valid state.
  setCliArgs: (args) =>
    set((state) => {
      const newState = { ...state, ...args };
      // Ensure mutual exclusion is maintained after merge
      if (args.port !== undefined) {
        newState.redirect = undefined;
      }
      if (args.redirect !== undefined) {
        newState.port = undefined;
      }
      // Assert the final type conforms to CliState
      return newState as CliState;
    }),
}));

export const useCliStore = createSelectors(store);
