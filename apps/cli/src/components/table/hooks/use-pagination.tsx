import { useCallback, useMemo } from 'react';
import { useTableStore } from '../store';
import type { PaginationState, ScalarDict } from '../types';

interface UsePaginationProps<T extends ScalarDict> {
  data: T[];
  itemsPerPage?: number;
  dimensions: { height: number };
  onNavigate: (index: number) => void;
}

export function usePagination<T extends ScalarDict>({
  data,
  itemsPerPage,
  dimensions,
  onNavigate,
}: UsePaginationProps<T>): PaginationState<T> & {
  navigateToPage: (page: number, options?: { selectLast?: boolean }) => void;
} {
  const currentPage = useTableStore.use.currentPage();
  const setPageSize = useTableStore.use.setPageSize();
  const storeNavigateToPage = useTableStore.use.navigateToPage();

  // Calculate page size based on terminal height or use provided itemsPerPage
  const pageSize = useMemo(() => {
    if (itemsPerPage) return itemsPerPage;

    // Account for:
    // - 1 line for top border
    // - 1 line for header
    // - 1 line for header border
    // - 2 lines for action bar (commands and pagination info)
    // - 1 line for bottom border
    const reservedLines = 6;

    // Use maximum available height
    const calculatedPageSize = Math.max(1, dimensions.height - reservedLines);
    setPageSize(calculatedPageSize);
    return calculatedPageSize;
  }, [itemsPerPage, dimensions.height, setPageSize]);

  const totalPages = useMemo(
    () => Math.ceil(data.length / pageSize),
    [data.length, pageSize],
  );

  // Get current page's data
  const currentPageData = useMemo(() => {
    const start = currentPage * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const navigateToPage = useCallback(
    (page: number, options: { selectLast?: boolean } = {}) => {
      storeNavigateToPage(page, options);
      const newPage = Math.max(0, Math.min(page, totalPages - 1));
      if (newPage !== currentPage) {
        const newIndex = options.selectLast
          ? Math.min((newPage + 1) * pageSize - 1, data.length - 1)
          : newPage * pageSize;
        onNavigate(newIndex);
      }
    },
    [
      currentPage,
      totalPages,
      pageSize,
      data.length,
      onNavigate,
      storeNavigateToPage,
    ],
  );

  return {
    currentPage,
    pageSize,
    totalPages,
    currentPageData,
    navigateToPage,
  };
}
