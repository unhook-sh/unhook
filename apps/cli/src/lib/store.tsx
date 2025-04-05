import { type ReactNode, createContext, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';

export interface SelectionState {
  selectedIndices: {
    menu: number;
    requests: number;
  };
}

interface SelectionActions {
  setMenuIndex: (index: number) => void;
  setRequestsIndex: (index: number) => void;
  resetIndices: () => void;
}

type SelectionStore = SelectionState & SelectionActions;

export const defaultInitState: SelectionState = {
  selectedIndices: {
    menu: -1,
    requests: -1,
  },
};

export const createSelectionStore = (
  initState: SelectionState = defaultInitState,
) => {
  return createStore<SelectionStore>()((set) => ({
    ...initState,
    setMenuIndex: (index) =>
      set((state) => ({
        selectedIndices: {
          ...state.selectedIndices,
          menu: index,
        },
      })),
    setRequestsIndex: (index) =>
      set((state) => ({
        selectedIndices: {
          ...state.selectedIndices,
          requests: index,
        },
      })),
    resetIndices: () =>
      set({
        selectedIndices: {
          menu: 0,
          requests: 0,
        },
      }),
  }));
};

export type SelectionStoreApi = ReturnType<typeof createSelectionStore>;

const SelectionStoreContext = createContext<SelectionStoreApi | undefined>(
  undefined,
);

export interface SelectionStoreProviderProps {
  children: ReactNode;
}

export function SelectionStoreProvider({
  children,
}: SelectionStoreProviderProps) {
  const storeRef = useRef<SelectionStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createSelectionStore();
  }

  return (
    <SelectionStoreContext.Provider value={storeRef.current}>
      {children}
    </SelectionStoreContext.Provider>
  );
}

export const useSelectionStore = <T,>(
  selector: (store: SelectionStore) => T,
): T => {
  const selectionStoreContext = useContext(SelectionStoreContext);

  if (!selectionStoreContext) {
    throw new Error(
      'useSelectionStore must be used within SelectionStoreProvider',
    );
  }

  return useStore(selectionStoreContext, selector);
};
