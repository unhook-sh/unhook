import figures from 'figures';
import { Box, measureElement, Text } from 'ink';
import React, { useEffect, useRef, useState } from 'react';
import { useDimensions } from '~/hooks/use-dimensions';
import {
  calculateColumnWidths,
  getVisibleColumns,
  padContent,
} from './column-utils';
import { ActionBar } from './components/action-bar';
import { Cell } from './components/cell';
import { Header } from './components/header';
import { Scrollbar } from './components/scroll-bar';
import { useKeyboardNavigation } from './hooks/use-keyboard-navigation';
import { useTableStore } from './store';
import type {
  CellProps,
  ColumnDef,
  KeyMapping,
  ScalarDict,
  TableAction,
} from './types';

interface TableProps<T extends ScalarDict> {
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
  /** Total count of rows */
  totalCount?: number;
  /** Key mapping for navigation */
  keyMapping?: KeyMapping;
  /** Unique identifier for persisting table state */
  storeId?: string;
}

export function Table<T extends ScalarDict>({
  data,
  columns,
  padding = 1,
  initialIndex = -1,
  onSelectionChange,
  actions = [],
  itemsPerPage,
  totalCount,
  keyMapping = {
    up: ['k', 'up'],
    down: ['j', 'down', ' '],
    top: ['gg'],
    bottom: ['G'],
    pageUp: ['ctrl+b', 'b'],
    pageDown: ['ctrl+f', 'f'],
    halfPageUp: ['ctrl+u', 'u'],
    halfPageDown: ['ctrl+d', 'd'],
    nextPage: ['l', 'right'],
    prevPage: ['h', 'left'],
  },
}: TableProps<T>) {
  const dimensions = useDimensions();
  const tableRef = useRef<React.ComponentRef<typeof Box>>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we only need to measure the width once
  useEffect(() => {
    if (tableRef.current) {
      const { width } = measureElement(tableRef.current);
      if (width && width > 0) setMeasuredWidth(width);
    }
  }, [dimensions.width]);
  // Account for:
  // - 1 line for top border
  // - 1 line for header
  // - 1 line for header border
  // - 1 line for bottom border
  // - 1 line for action bar
  // - 1 line for pagination info (if needed)
  const heightOfReservedLines = 5;

  // biome-ignore lint/correctness/useExhaustiveDependencies: we only need to measure the height once
  useEffect(() => {
    if (tableRef.current) {
      const { height } = measureElement(tableRef.current);
      if (height && height > 0)
        setMeasuredHeight(height - heightOfReservedLines);
    }
  }, [dimensions.height]);

  const availableWidth = measuredWidth ?? dimensions.width;
  const availableHeight = measuredHeight ?? dimensions.height;

  // Calculate initial page size
  const initialPageSize = React.useMemo(() => {
    if (itemsPerPage) return itemsPerPage;

    // Ensure we have at least 1 row
    return Math.max(availableHeight ?? 0, 1);
  }, [availableHeight, itemsPerPage]);

  // Initialize table data
  const initializeTable = useTableStore.use.initializeTable();
  const selectedIndex = useTableStore.use.selectedIndex();
  const currentPage = useTableStore.use.currentPage();
  const pageSize = useTableStore.use.pageSize();
  const tableData = useTableStore.use.data();

  // Initialize table with data and settings
  useEffect(() => {
    initializeTable(data, initialIndex, initialPageSize, totalCount);
  }, [data, initialIndex, initialPageSize, initializeTable, totalCount]);

  // Handle selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIndex);
    }
  }, [selectedIndex, onSelectionChange]);

  // Setup keyboard navigation
  useKeyboardNavigation({ data, actions, keyMapping });

  // Get current page's data
  const currentPageData = React.useMemo(() => {
    const start = currentPage * pageSize;
    return tableData.slice(start, start + pageSize);
  }, [tableData, currentPage, pageSize]);

  // Determine which columns to show based on available width
  const visibleColumns = React.useMemo(
    () =>
      getVisibleColumns({
        columns,
        availableWidth,
        padding,
      }),
    [columns, availableWidth, padding],
  );

  const columnWidths = React.useMemo(
    () =>
      calculateColumnWidths({
        data,
        columns: visibleColumns,
        padding,
        maxWidth: availableWidth,
      }),
    [data, visibleColumns, padding, availableWidth],
  );

  const renderCell = React.useCallback(
    (props: {
      column: ColumnDef<T>;
      row: T;
      isHeader: boolean;
      colIndex: number;
      rowIndex: number;
    }) => {
      const { column, row, isHeader, colIndex, rowIndex } = props;
      const width = columnWidths[column.id] || 0;
      const contentWidth = width - padding * 2;

      let content: React.ReactNode;
      if (isHeader) {
        content =
          typeof column.header === 'string'
            ? column.header
            : column.header({
                column: column.id,
                row,
                isHeader: true,
                isSelected: true,
                children: '',
                width: contentWidth,
              });
      } else {
        const value = column.accessorFn
          ? column.accessorFn(row)
          : column.accessorKey
            ? row[column.accessorKey]
            : '';

        if (column.cell) {
          const cellProps: CellProps<T> = {
            column: column.id,
            row,
            isHeader: false,
            isSelected: rowIndex === selectedIndex,
            rowId: `row-${rowIndex}`,
            children: value as React.ReactNode,
            width: contentWidth,
          };
          content = column.cell(cellProps);
        } else {
          content = String(value ?? '');
        }
      }

      const paddedContent =
        typeof content === 'string'
          ? padContent({
              content,
              width,
              padding,
            })
          : content;

      const cellProps: CellProps<T> = {
        column: column.id,
        row,
        isHeader,
        isSelected: !isHeader && rowIndex === selectedIndex,
        rowId: !isHeader ? `row-${rowIndex}` : undefined,
        children: paddedContent,
        width: contentWidth,
      };

      return (
        <React.Fragment key={`${column.id}-${rowIndex}`}>
          <Box width={width || 0}>
            {isHeader ? <Header {...cellProps} /> : <Cell {...cellProps} />}
          </Box>
          {colIndex < visibleColumns.length - 1 && (
            <Text dimColor>{figures.lineVertical}</Text>
          )}
        </React.Fragment>
      );
    },
    [columnWidths, padding, selectedIndex, visibleColumns.length],
  );

  const renderRow = React.useCallback(
    ({
      row,
      isHeader = false,
      rowIndex = -1,
    }: {
      row: T;
      isHeader?: boolean;
      rowIndex?: number;
    }) => (
      <Box flexDirection="row">
        {visibleColumns.map((column, colIndex) => (
          <React.Fragment key={`${column.id}-${rowIndex}`}>
            {renderCell({
              column,
              row,
              isHeader,
              colIndex,
              rowIndex,
            })}
          </React.Fragment>
        ))}
      </Box>
    ),
    [visibleColumns, renderCell],
  );

  const renderBorder = React.useCallback(() => {
    return (
      <Box flexDirection="row">
        {visibleColumns.map((column, index) => (
          <React.Fragment key={`border-${column.id}`}>
            <Box width={columnWidths[column.id] || 0}>
              <Text dimColor>
                {figures.line.repeat(columnWidths[column.id] || 0)}
              </Text>
            </Box>
            {index < visibleColumns.length - 1 && (
              <Text dimColor>{figures.lineUpDownLeftRight}</Text>
            )}
          </React.Fragment>
        ))}
      </Box>
    );
  }, [visibleColumns, columnWidths]);

  return (
    <Box flexDirection="column">
      <Box
        ref={tableRef}
        borderColor="blue"
        borderStyle="round"
        flexDirection="row"
        flexGrow={1}
        height={'100%'}
        // height={availableHeight}
      >
        <Box flexDirection="column" width="100%">
          {renderRow({ row: {} as T, isHeader: true })}
          <Box>{renderBorder()}</Box>

          <Box flexDirection="row">
            <Box flexDirection="column" width="100%">
              {currentPageData.map((row, index) => {
                const rowKey = Object.entries(row)
                  .map(([k, v]) => `${k}:${String(v)}`)
                  .join('|');

                return (
                  <Box key={`${rowKey}-${selectedIndex}`}>
                    {renderRow({
                      row: row as T,
                      isHeader: false,
                      rowIndex: index + currentPage * pageSize,
                    })}
                  </Box>
                );
              })}
            </Box>

            {Math.ceil((totalCount ?? data.length) / pageSize) > 1 && (
              <Scrollbar />
            )}
          </Box>
        </Box>
      </Box>

      <ActionBar actions={actions} />
    </Box>
  );
}
