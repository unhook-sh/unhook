import type { ReactNode } from 'react';

export interface Scalar {
  toString(): string;
}

export interface ScalarDict {
  [key: string]: unknown;
}

export interface TableAction<T> {
  key: string;
  label: string;
  onAction: (row: T, index: number) => void;
}

export interface CellProps<T> {
  column: string;
  row: T;
  isHeader: boolean;
  isSelected: boolean;
  rowId?: string;
  children: ReactNode;
  width: number;
}

export interface KeyMapping {
  up: string[];
  down: string[];
  top: string[];
  bottom: string[];
  pageUp: string[];
  pageDown: string[];
  halfPageUp: string[];
  halfPageDown: string[];
  nextPage: string[];
  prevPage: string[];
}

export interface ColumnDef<T> {
  /** Unique identifier for the column */
  id: string;
  /** Display name for the column header */
  header: string | ((props: CellProps<T>) => ReactNode);
  /** Function to get the cell value */
  accessorKey?: keyof T;
  /** Custom accessor function */
  accessorFn?: (row: T) => unknown;
  /** Custom cell renderer */
  cell?: (props: CellProps<T>) => ReactNode;
  /** Minimum width of the column */
  minWidth?: number;
  /** Maximum width of the column */
  maxWidth?: number;
  /** Whether the column can be sorted */
  enableSorting?: boolean;
  /** Whether the column can be hidden */
  enableHiding?: boolean;
  /** Priority for column visibility (lower = more important) */
  priority?: number;
}

export interface TableProps<T extends ScalarDict> {
  /** List of rows */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Cell padding */
  padding?: number;
  /** Component for table borders */
  skeleton?: React.ComponentType<React.PropsWithChildren>;
  /** Initial selected index */
  initialIndex?: number;
  /** Callback when selection changes */
  onSelectionChange?: (index: number) => void;
  /** Available actions for each row */
  actions?: TableAction<T>[];
  /** Items per page */
  itemsPerPage?: number;
  /** Maximum height of the table in rows */
  maxHeight?: number;
  /** Key mapping for navigation */
  keyMapping?: KeyMapping;
  /** Unique identifier for persisting table state */
  storeId?: string;
  /** Total count of items (for pagination when data is a subset) */
  totalCount?: number;
}

export interface PaginationState<T extends ScalarDict> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  currentPageData: T[];
}

export interface SelectionState {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}
