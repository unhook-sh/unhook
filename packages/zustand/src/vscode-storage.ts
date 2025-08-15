import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// VSCode Extension Context interface
export interface VscodeExtensionContext {
  globalState: {
    get<T>(key: string, defaultValue?: T): T;
    update(key: string, value: unknown): Promise<void>;
  };
  workspaceState: {
    get<T>(key: string, defaultValue?: T): T;
    update(key: string, value: unknown): Promise<void>;
  };
}

type MementoScope = 'global' | 'workspace';

// VS Code memento-based storage adapter (async-capable)
export const vscodeMementoStorage = (
  memento: VscodeExtensionContext['globalState'],
) => ({
  getItem: async (name: string): Promise<string | null> => {
    try {
      const v = memento.get<string | undefined>(name);
      return v ?? null;
    } catch (error) {
      console.error(
        `Error reading from VSCode storage for key "${name}":`,
        error,
      );
      return null;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await memento.update(name, undefined);
    } catch (error) {
      console.error(
        `Error removing from VSCode storage for key "${name}":`,
        error,
      );
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await memento.update(name, value);
    } catch (error) {
      console.error(
        `Error writing to VSCode storage for key "${name}":`,
        error,
      );
    }
  },
});

// Convenience factory to create a persisted store in the extension host
export function makeVSCodeStore<TState>(opts: {
  context: VscodeExtensionContext;
  scope?: MementoScope;
  name: string;
  initializer: (
    set: (partial: Partial<TState>) => void,
    get: () => TState,
  ) => TState;
  partialize?: (state: TState) => Partial<TState>;
}) {
  const { context, scope = 'global', name, initializer, partialize } = opts;
  const memento =
    scope === 'global' ? context.globalState : context.workspaceState;

  const storage = createJSONStorage(() => vscodeMementoStorage(memento));

  const store = create<TState>()(
    persist(initializer, {
      name,
      partialize,
      storage,
      version: 1,
    }),
  );

  return store;
}

// Message shapes for webview sync
export type VSMessage =
  | { type: 'zustand:patch'; payload: unknown }
  | { type: 'zustand:request_state' }
  | { type: 'zustand:hydrate'; payload: unknown };

// Apply a partial patch into the store
export function applyPatch<T>(
  store: { setState: (patch: Partial<T>) => void },
  patch: Partial<T>,
) {
  store.setState(patch);
}

// Generic VSCode storage store interface
export interface VscodeStorageStore<T> {
  data: T;
  setData: (data: T) => void;
  updateData: (updates: Partial<T>) => void;
  resetData: () => void;
}

// Create a generic VSCode storage store
export function createVscodeStorageStore<T>(
  context: VscodeExtensionContext,
  key: string,
  defaultValue: T,
  storageType: 'global' | 'workspace' = 'global',
) {
  return makeVSCodeStore({
    context,
    initializer: (set, get) => ({
      data: defaultValue,
      resetData: () => set({ data: defaultValue }),
      setData: (data: T) => set({ data }),
      updateData: (updates: Partial<T>) => {
        const newData = { ...get().data, ...updates };
        set({ data: newData });
      },
    }),
    name: key,
    partialize: (state: {
      data: T;
      resetData: () => void;
      setData: (data: T) => void;
      updateData: (updates: Partial<T>) => void;
    }) => ({ data: state.data }),
    scope: storageType,
  });
}

// Convenience hook for using the store
export function useVscodeStorage<T>(
  store: ReturnType<typeof createVscodeStorageStore<T>>,
) {
  return store((state) => ({
    data: state.data,
    resetData: state.resetData,
    setData: state.setData,
    updateData: state.updateData,
  }));
}
