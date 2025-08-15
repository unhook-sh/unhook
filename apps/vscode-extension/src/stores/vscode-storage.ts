import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Webview-side store with local persistence only (no extension sync for now)
export function createWebviewStore<T>(key: string, defaultValue: T) {
  return create<VscodeStorageStore<T>>()(
    persist(
      (set, get) => ({
        // Initialize with default value
        data: defaultValue,

        resetData: () => {
          set({ data: defaultValue });
        },

        setData: (data: T) => {
          set({ data });
        },

        updateData: (updates: Partial<T>) => {
          const newData = { ...get().data, ...updates };
          set({ data: newData });
        },
      }),
      {
        name: `webview-${key}`,
        // Only persist the data field
        partialize: (state) => ({ data: state.data }),
        // Use sessionStorage for fast local persistence
        storage: createJSONStorage(() => sessionStorage),
        version: 1,
      },
    ),
  );
}

// Generic VSCode storage store interface
export interface VscodeStorageStore<T> {
  // The stored data
  data: T;

  // Actions
  setData: (data: T) => void;
  updateData: (updates: Partial<T>) => void;
  resetData: () => void;
}

// Convenience hook for using the store
export function useVscodeStorage<T>(
  store: ReturnType<typeof createWebviewStore<T>>,
) {
  return store((state) => ({
    data: state.data,
    resetData: state.resetData,
    setData: state.setData,
    updateData: state.updateData,
  }));
}

// VSCode extension specific storage types
export interface VscodeExtensionStorage {
  // Payload format preferences
  payloadFormat: 'raw' | 'json' | 'yaml';

  // UI preferences
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;

  // Component-specific preferences
  eventDetails: {
    activeTab: 'payload' | 'headers' | 'forwards';
    showAiPrompt: boolean;
  };
}

// Create stores for different parts of the extension
export const payloadFormatStore = createWebviewStore<'raw' | 'json' | 'yaml'>(
  'payloadFormat',
  'json',
);

export const themeStore = createWebviewStore<'light' | 'dark' | 'system'>(
  'theme',
  'system',
);

export const sidebarCollapsedStore = createWebviewStore<boolean>(
  'sidebarCollapsed',
  false,
);

export const eventDetailsStore = createWebviewStore<{
  activeTab: 'payload' | 'headers' | 'forwards';
  showAiPrompt: boolean;
}>('eventDetails', {
  activeTab: 'payload',
  showAiPrompt: false,
});

// Convenience hooks for specific parts of the storage
export const usePayloadFormat = () => useVscodeStorage(payloadFormatStore);
export const useTheme = () => useVscodeStorage(themeStore);
export const useSidebarCollapsed = () =>
  useVscodeStorage(sidebarCollapsedStore);
export const useEventDetails = () => useVscodeStorage(eventDetailsStore);
