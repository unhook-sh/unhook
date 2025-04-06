import debug from 'debug';
import figures from 'figures';
import { Box, Text } from 'ink';
import React from 'react';
import { useDimensions } from '~/hooks/use-dimensions';

const log = debug('tunnel:table');

// Types
interface Scalar {
  toString(): string;
}

interface ScalarDict {
  [key: string]: Scalar | null | undefined;
}

interface CellProps {
  column: string;
  row: Record<string, unknown>;
  isHeader?: boolean;
  children?: React.ReactNode;
}

interface TableProps<T extends ScalarDict> {
  /** List of rows */
  data: T[];
  /** Columns to display */
  columns?: (keyof T)[];
  /** Cell padding */
  padding?: number;
  /** Component for header cells */
  header?: React.ComponentType<CellProps>;
  /** Component for data cells */
  cell?: React.ComponentType<CellProps>;
  /** Component for table borders */
  skeleton?: React.ComponentType<React.PropsWithChildren>;
}

interface BorderChars {
  left: string;
  mid: string;
  right: string;
  line: string;
}

interface BorderConfig {
  top: BorderChars;
  middle: BorderChars;
  bottom: BorderChars;
}

// Default components
function Header({ children }: CellProps) {
  return (
    <Text bold color="blue">
      {children}
    </Text>
  );
}

function Cell({ children }: CellProps) {
  return <Text>{children}</Text>;
}

function Skeleton({ children }: React.PropsWithChildren) {
  return <Text color="gray">{children}</Text>;
}

// Helper functions
function calculateColumnWidths<T extends ScalarDict>(
  data: T[],
  columns: (keyof T)[],
  padding: number,
): Record<string, number> {
  const widths: Record<string, number> = {};

  // Initialize widths with column header lengths
  for (const column of columns) {
    widths[String(column)] = String(column).length + padding * 2;
  }

  // Update widths based on data
  for (const row of data) {
    for (const column of columns) {
      const value = row[column];
      if (value != null) {
        const length = String(value).length + padding * 2;
        widths[String(column)] = Math.max(widths[String(column)] || 0, length);
      }
    }
  }

  log('widths', widths);
  return widths;
}

const BORDER_CHARS: BorderConfig = {
  top: {
    left: figures.lineDownRight,
    mid: figures.lineDownBoldRight,
    right: figures.lineDownLeft,
    line: figures.line,
  },
  middle: {
    left: figures.lineUpDownRight,
    mid: figures.lineUpDownLeftRight,
    right: figures.lineUpDownLeft,
    line: figures.line,
  },
  bottom: {
    left: figures.lineUpRight,
    mid: figures.lineUpBoldRight,
    right: figures.lineUpLeft,
    line: figures.line,
  },
};

// Main component
export function Table<T extends ScalarDict>({
  data,
  columns: propColumns,
  padding = 1,
  header: HeaderComponent = Header,
  cell: CellComponent = Cell,
  skeleton: SkeletonComponent = Skeleton,
}: TableProps<T>) {
  const dimensions = useDimensions();

  const columns = React.useMemo(() => {
    if (propColumns) return propColumns;

    const keys = new Set<keyof T>();
    for (const row of data) {
      for (const key of Object.keys(row)) {
        keys.add(key as keyof T);
      }
    }
    return Array.from(keys);
  }, [data, propColumns]);

  const columnWidths = React.useMemo(
    () => calculateColumnWidths(data, columns, padding),
    [data, columns, padding],
  );

  const renderCell = React.useCallback(
    (props: {
      column: keyof T;
      value: unknown;
      isHeader: boolean;
      row: T;
      colIndex: number;
    }) => {
      const { column, value, isHeader, row, colIndex } = props;
      const key = String(column);
      const width = columnWidths[key] || 0;
      const content = String(value ?? '');

      const leftPadding = ' '.repeat(padding);
      const rightPadding = ' '.repeat(width - content.length - padding);
      const paddedContent = `${leftPadding}${content}${rightPadding}`;

      const Component = isHeader ? HeaderComponent : CellComponent;

      return (
        <React.Fragment>
          <Component column={key} row={row} isHeader={isHeader}>
            {paddedContent}
          </Component>
          {colIndex < columns.length - 1 && (
            <SkeletonComponent>│</SkeletonComponent>
          )}
        </React.Fragment>
      );
    },
    [
      columnWidths,
      padding,
      HeaderComponent,
      CellComponent,
      SkeletonComponent,
      columns.length,
    ],
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
      <Box key={isHeader ? 'header' : `row-${rowIndex}`} flexDirection="row">
        {columns.map((column, colIndex) => (
          <React.Fragment
            key={`cell-${isHeader ? 'header' : rowIndex}-${String(column)}`}
          >
            {renderCell({
              column,
              value: isHeader ? column : row[column],
              isHeader,
              row,
              colIndex,
            })}
          </React.Fragment>
        ))}
      </Box>
    ),
    [columns, renderCell],
  );

  const renderBorder = React.useCallback(
    (position: keyof BorderConfig, rowIndex = -1) => {
      const chars = BORDER_CHARS[position];
      const parts: React.ReactNode[] = [];

      for (const [i, column] of columns.entries()) {
        const key = String(column);
        const width = columnWidths[key] || 0;
        const line = chars.line.repeat(width);

        parts.push(
          <SkeletonComponent key={`border-${position}-${String(column)}-line`}>
            {line}
          </SkeletonComponent>,
        );

        if (i < columns.length - 1) {
          parts.push(
            <SkeletonComponent key={`border-${position}-${String(column)}-mid`}>
              {chars.mid}
            </SkeletonComponent>,
          );
        }
      }

      return (
        <Box key={`border-${position}-${rowIndex}`} width={dimensions.width}>
          {parts}
        </Box>
      );
    },
    [columns, columnWidths, dimensions.width, SkeletonComponent],
  );

  const headerData = React.useMemo(
    () =>
      columns.reduce(
        (acc, col) => {
          acc[col as string] = col;
          return acc;
        },
        {} as Record<string, unknown>,
      ) as T,
    [columns],
  );

  return (
    <Box
      borderColor="gray"
      borderStyle="round"
      width={dimensions.width}
      flexDirection="column"
    >
      {renderRow({ row: headerData, isHeader: true })}
      {renderBorder('middle')}

      {data.map((row) => {
        // Create a stable key from the row's unique data
        const rowKey = Object.entries(row)
          .map(([k, v]) => `${k}:${String(v)}`)
          .join('|');

        return (
          <Box key={rowKey} flexDirection="column">
            {renderRow({ row, isHeader: false })}
          </Box>
        );
      })}
    </Box>
  );
}

export default Table;
