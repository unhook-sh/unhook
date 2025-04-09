import { createStore } from 'zustand';
import { createSelectors } from '~/lib/zustand-create-selectors';
import type { ScalarDict } from './types';

// Define the base state
interface TableState<T extends ScalarDict> {
  currentPage: number;
  selectedIndex: number;
  pageSize: number;
  data: T[];
  gKeyPressed: boolean;
  numberBuffer: string;
}

// Define actions separately
interface TableActions<T extends ScalarDict> {
  setCurrentPage: (page: number) => void;
  setSelectedIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  setData: (data: T[]) => void;
  setGKeyPressed: (pressed: boolean) => void;
  setNumberBuffer: (buffer: string) => void;
  navigateToPage: (page: number, options?: { selectLast?: boolean }) => void;
  navigateToIndex: (index: number) => void;
  clearGKeyState: () => void;
  initializeTable: (data: T[], initialIndex: number, pageSize: number) => void;
}

// Combine state and actions
type TableStore<T extends ScalarDict> = TableState<T> & TableActions<T>;

// Default state
const defaultTableState = {
  currentPage: 0,
  selectedIndex: -1,
  pageSize: 10,
  data: [],
  gKeyPressed: false,
  numberBuffer: '',
};

const store = createStore<TableStore<ScalarDict>>()((set, get) => ({
  ...defaultTableState,

  setCurrentPage: (page: number) =>
    set({
      currentPage: Math.max(
        0,
        Math.min(page, Math.ceil(get().data.length / get().pageSize) - 1),
      ),
    }),

  setSelectedIndex: (index: number) =>
    set({
      selectedIndex: Math.max(-1, Math.min(index, get().data.length - 1)),
    }),

  setPageSize: (size: number) => set({ pageSize: Math.max(1, size) }),

  setData: (data: ScalarDict[]) => set({ data }),

  setGKeyPressed: (pressed: boolean) => set({ gKeyPressed: pressed }),

  setNumberBuffer: (buffer: string) => set({ numberBuffer: buffer }),

  navigateToPage: (page: number, options?: { selectLast?: boolean }) => {
    const { pageSize, data } = get();
    const newPage = Math.max(
      0,
      Math.min(page, Math.ceil(data.length / pageSize) - 1),
    );
    const newIndex = options?.selectLast
      ? Math.min((newPage + 1) * pageSize - 1, data.length - 1)
      : newPage * pageSize;

    set({
      currentPage: newPage,
      selectedIndex: newIndex,
    });
  },

  navigateToIndex: (index: number) => {
    const { pageSize, data } = get();
    const boundedIndex = Math.max(0, Math.min(index, data.length - 1));
    const newPage = Math.floor(boundedIndex / pageSize);

    set({
      selectedIndex: boundedIndex,
      currentPage: newPage,
    });
  },

  clearGKeyState: () =>
    set({
      gKeyPressed: false,
      numberBuffer: '',
    }),

  initializeTable: (
    data: ScalarDict[],
    initialIndex: number,
    pageSize: number,
  ) => {
    // First set the data and page size
    set((state) => ({
      ...state,
      data,
      pageSize,
    }));

    // Always validate and set the initial index if it's not already set
    const currentIndex = get().selectedIndex;
    if (currentIndex === -1 && data.length > 0) {
      // Ensure initialIndex is within bounds
      const validInitialIndex = Math.max(
        0,
        Math.min(initialIndex, data.length - 1),
      );
      const initialPage = Math.floor(validInitialIndex / pageSize);

      set((state) => ({
        ...state,
        currentPage: initialPage,
        selectedIndex: validInitialIndex,
      }));
    }
  },
}));

export const useTableStore = createSelectors(store);
