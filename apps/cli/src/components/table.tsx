import figures from 'figures';
import { Box, Text, useInput } from 'ink';
import React from 'react';
import { useDimensions } from '~/hooks/use-dimensions';

// Types
interface Scalar {
  toString(): string;
}

interface ScalarDict {
  [key: string]: Scalar | null | undefined;
}

interface TableAction<T> {
  key: string;
  label: string;
  onAction: (item: T, index: number) => void;
}

export interface CellProps {
  column: string;
  row: Record<string, unknown>;
  isHeader?: boolean;
  isSelected?: boolean;
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
  /** Initial selected index */
  initialIndex?: number;
  /** Callback when selection changes */
  onSelectionChange?: (index: number) => void;
  /** Available actions for each row */
  actions?: TableAction<T>[];
  /** Key mapping for navigation */
  keyMapping?: {
    up?: string[];
    down?: string[];
  };
}

// Default components
function Header({ children }: CellProps) {
  return (
    <Text bold color="blue">
      {children}
    </Text>
  );
}

function Cell({ children, isSelected }: CellProps) {
  return <Text color={isSelected ? 'green' : undefined}>{children}</Text>;
}

function Skeleton({ children }: React.PropsWithChildren) {
  return <Text color="gray">{children}</Text>;
}

function calculateColumnWidths<T extends ScalarDict>({
  data,
  columns,
  padding,
  maxWidth,
}: {
  data: T[];
  columns: (keyof T)[];
  padding: number;
  maxWidth: number;
}): Record<string, number> {
  const widths: Record<string, number> = {};

  // Calculate initial widths
  for (const column of columns) {
    widths[String(column)] = String(column).length + padding * 2;
  }

  // Update widths based on data
  for (const row of data) {
    for (const column of columns) {
      const value = row[column];
      if (value != null) {
        const length = String(value).length + padding * 2;
        widths[String(column)] = Math.max(widths[String(column)] ?? 0, length);
      }
    }
  }

  // Calculate total width including borders
  const borderChars = columns.length - 1; // Vertical borders between columns
  const totalWidth =
    Object.values(widths).reduce((sum, width) => sum + (width ?? 0), 0) +
    borderChars;

  // If total width exceeds maxWidth, proportionally reduce column widths
  if (totalWidth > maxWidth) {
    const ratio = (maxWidth - borderChars) / (totalWidth - borderChars);
    for (const key of Object.keys(widths)) {
      widths[key] = Math.max(
        Math.floor((widths[key] ?? 0) * ratio),
        padding * 2 + 1,
      );
    }
  }

  return widths;
}

export function Table<T extends ScalarDict>({
  data,
  columns: propColumns,
  padding = 1,
  header: HeaderComponent = Header,
  cell: CellComponent = Cell,
  skeleton: SkeletonComponent = Skeleton,
  initialIndex = -1,
  onSelectionChange,
  actions = [],
  keyMapping = {
    up: ['k', 'up'],
    down: ['j', 'down'],
  },
}: TableProps<T>) {
  const dimensions = useDimensions();
  const [selectedIndex, setSelectedIndex] = React.useState(initialIndex);

  // Sync internal state with external state
  React.useEffect(() => {
    setSelectedIndex(initialIndex);
  }, [initialIndex]);

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
    () =>
      calculateColumnWidths({
        data,
        columns,
        padding,
        maxWidth: dimensions.width - 2,
      }), // -2 for outer borders
    [data, columns, padding, dimensions.width],
  );

  // Handle keyboard input
  useInput((input, key) => {
    const isUpKey =
      keyMapping.up?.includes(input) ||
      (key.upArrow && keyMapping.up?.includes('up'));
    const isDownKey =
      keyMapping.down?.includes(input) ||
      (key.downArrow && keyMapping.down?.includes('down'));

    if (isUpKey) {
      const newIndex = Math.max(0, selectedIndex - 1);
      if (newIndex !== selectedIndex) {
        setSelectedIndex(newIndex);
        onSelectionChange?.(newIndex);
      }
    } else if (isDownKey) {
      const newIndex = Math.min(data.length - 1, selectedIndex + 1);
      if (newIndex !== selectedIndex) {
        setSelectedIndex(newIndex);
        onSelectionChange?.(newIndex);
      }
    } else {
      // Check for action hotkeys
      const action = actions.find((a) => a.key === input.toLowerCase());
      const selectedItem =
        selectedIndex >= 0 && selectedIndex < data.length
          ? data[selectedIndex]
          : null;
      if (action && selectedItem) {
        action.onAction(selectedItem, selectedIndex);
      }
    }
  });

  const renderCell = React.useCallback(
    (props: {
      column: keyof T;
      value: unknown;
      isHeader: boolean;
      row: T;
      colIndex: number;
      rowIndex: number;
    }) => {
      const { column, value, isHeader, row, colIndex, rowIndex } = props;
      const key = String(column);
      const width = columnWidths[key] || 0;
      const content = String(value ?? '');

      const leftPadding = ' '.repeat(padding);
      const contentWidth = width - padding * 2;
      const truncatedContent =
        content.length > contentWidth
          ? `${content.slice(0, contentWidth - 1)}…`
          : content;
      const rightPadding = ' '.repeat(
        width - truncatedContent.length - padding,
      );
      const paddedContent = `${leftPadding}${truncatedContent}${rightPadding}`;

      const Component = isHeader ? HeaderComponent : CellComponent;

      return (
        <React.Fragment>
          <Component
            column={key}
            row={row}
            isHeader={isHeader}
            isSelected={!isHeader && rowIndex === selectedIndex}
          >
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
      selectedIndex,
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
              rowIndex,
            })}
          </React.Fragment>
        ))}
      </Box>
    ),
    [columns, renderCell],
  );

  const renderBorder = React.useCallback(
    (position: 'top' | 'middle' | 'bottom', rowIndex = -1) => {
      const chars = {
        top: figures.line,
        middle: figures.line,
        bottom: figures.line,
      };

      const parts: React.ReactNode[] = [];

      for (const [i, column] of columns.entries()) {
        const key = String(column);
        const width = columnWidths[key] || 0;
        const line = chars[position].repeat(width);

        parts.push(
          <SkeletonComponent key={`border-${position}-${String(column)}-line`}>
            {line}
          </SkeletonComponent>,
        );

        if (i < columns.length - 1) {
          parts.push(
            <SkeletonComponent key={`border-${position}-${String(column)}-mid`}>
              {figures.lineUpDownLeftRight}
            </SkeletonComponent>,
          );
        }
      }

      return <Box key={`border-${position}-${rowIndex}`}>{parts}</Box>;
    },
    [columns, columnWidths, SkeletonComponent],
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
    <Box flexDirection="column">
      <Box borderColor="gray" borderStyle="round" flexDirection="column">
        {renderRow({ row: headerData, isHeader: true })}
        {renderBorder('middle')}

        {data.map((row, index) => {
          const rowKey = Object.entries(row)
            .map(([k, v]) => `${k}:${String(v)}`)
            .join('|');

          return (
            <Box key={rowKey} flexDirection="column">
              {renderRow({ row, isHeader: false, rowIndex: index })}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Press{' '}
          <Text color="cyan">
            {[...(keyMapping.up ?? []), ...(keyMapping.down ?? [])].join('/')}
          </Text>{' '}
          to navigate
          {actions.length > 0 && (
            <>
              {', '}
              {actions
                .map((a) => (
                  <Text key={a.key}>
                    <Text color="cyan">{a.key}</Text> to {a.label.toLowerCase()}
                  </Text>
                ))
                .reduce((prev, curr) => (
                  <React.Fragment key={`${prev.key}-${curr.key}`}>
                    {prev}, {curr}
                  </React.Fragment>
                ))}
            </>
          )}
        </Text>
      </Box>
    </Box>
  );
}
