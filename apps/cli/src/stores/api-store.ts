import { createClient } from '@unhook/api/client';
import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';
// Combine base and exclusive properties into the final state type
export type ApiState = {
  api: ReturnType<typeof createClient>;
};

interface ApiActions {
  setApi: (api: ReturnType<typeof createClient>) => void;
  reset: () => void;
}

type ApiStore = ApiState & ApiActions;

const defaultApiState: Partial<ApiState> = {
  api: createClient(),
};

const store = createStore<ApiStore>()((set) => ({
  ...(defaultApiState as ApiState),

  // Individual setters remain simple
  setApi: (api) => set((state) => ({ ...state, api })),

  // Reset method to restore default state
  reset: () => set(defaultApiState as ApiState),
}));

export const useApiStore: ReturnType<typeof createSelectors<typeof store>> =
  createSelectors<typeof store>(store);
