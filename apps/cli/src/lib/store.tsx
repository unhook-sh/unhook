import { db } from '@acme/db/client';
import type { RequestType } from '@acme/db/schema';
import { Requests } from '@acme/db/schema';
import { eq } from 'drizzle-orm';
import { type ReactNode, createContext, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';

export interface SelectionState {
  selectedIndices: {
    menu: number;
    requests: number;
  };
}

interface RequestState {
  requests: RequestType[];
  isLoading: boolean;
}

interface RequestActions {
  setRequests: (requests: RequestType[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  fetchRequests: () => Promise<void>;
  handlePendingRequest: (request: RequestType) => Promise<void>;
}

interface SelectionActions {
  setMenuIndex: (index: number) => void;
  setRequestsIndex: (index: number) => void;
  resetIndices: () => void;
}

type SelectionStore = SelectionState &
  SelectionActions &
  RequestState &
  RequestActions;

export const defaultInitState: SelectionState & RequestState = {
  selectedIndices: {
    menu: -1,
    requests: -1,
  },
  requests: [],
  isLoading: true,
};

export const createSelectionStore = (
  initState: SelectionState & RequestState = defaultInitState,
) => {
  return createStore<SelectionStore>()((set, get) => ({
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
    setRequests: (requests) => set({ requests }),
    setIsLoading: (isLoading) => set({ isLoading }),
    fetchRequests: async () => {
      const requests = await db.query.Requests.findMany();
      set({ requests, isLoading: false });
    },
    handlePendingRequest: async (request: RequestType) => {
      if (request.status === 'pending') {
        try {
          const url = `http://localhost:${request.tunnelId}${request.request.url}`;
          console.log('url', url);
          const response = await fetch(url, {
            method: request.request.method,
            headers: request.request.headers,
            body: request.request.body,
          });

          // Update request status based on response
          await db
            .update(Requests)
            .set({
              status: 'completed',
              response: {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                body: await response.text(),
              },
              completedAt: new Date(),
            })
            .where(eq(Requests.id, request.id));

          // Refresh requests after update
          await get().fetchRequests();
        } catch (error) {
          console.error('Failed to forward request:', error);

          // Update request status to failed
          await db
            .update(Requests)
            .set({
              status: 'failed',
              completedAt: new Date(),
            })
            .where(eq(Requests.id, request.id));

          // Refresh requests after update
          await get().fetchRequests();
        }
      }
    },
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
