import debug from 'debug';
import { Box, Text } from 'ink';
import React, { type JSX } from 'react';

const log = debug('tunnel:table');

// Types
type Scalar = string | number | boolean | null | undefined;

type ScalarDict = Record<string, Scalar>;

export type CellProps = React.PropsWithChildren<{
  column: string;
  row: Record<string, unknown>;
  isHeader?: boolean;
}>;

export type TableProps<T extends ScalarDict> = {
  /**
   * List of rows.
   */
  data: T[];
  /**
   * Columns to display.
   */
  columns?: (keyof T)[];
  /**
   * Cell padding.
   */
  padding?: number;
  /**
   * Component for header cells.
   */
  header?: (props: CellProps) => JSX.Element;
  /**
   * Component for data cells.
   */
  cell?: (props: CellProps) => JSX.Element;
  /**
   * Component for table borders.
   */
  skeleton?: (
    props: React.PropsWithChildren<Record<string, unknown>>,
  ) => JSX.Element;
};

// Default components
export const Header = ({ children }: CellProps) => (
  <Text bold color="blue">
    {children}
  </Text>
);

export const Cell = ({ children }: CellProps) => <Text>{children}</Text>;

export const Skeleton = ({
  children,
}: React.PropsWithChildren<Record<string, unknown>>) => (
  <Text color="gray">{children}</Text>
);

// Helper function to calculate column widths
const calculateColumnWidths = <T extends ScalarDict>(
  data: T[],
  columns: (keyof T)[],
  padding: number,
): Record<string, number> => {
  const widths: Record<string, number> = {};

  for (const column of columns) {
    widths[column as string] = String(column).length + padding * 2;
  }

  for (const row of data) {
    for (const column of columns) {
      const value = row[column];
      if (value !== undefined && value !== null) {
        const length = String(value).length + padding * 2;
        widths[column as string] = Math.max(
          widths[column as string] || 0,
          length,
        );
      }
    }
  }

  log('widths', widths);
  return widths;
};

// Main table component
export function Table<T extends ScalarDict>({
  data,
  columns: propColumns,
  padding = 1,
  header: HeaderComponent = Header,
  cell: CellComponent = Cell,
  skeleton: SkeletonComponent = Skeleton,
}: TableProps<T>) {
  const allKeys = React.useMemo(() => {
    const keys = new Set<keyof T>();
    for (const row of data) {
      for (const key of Object.keys(row)) {
        keys.add(key as keyof T);
      }
    }
    return Array.from(keys);
  }, [data]);

  const columns = propColumns || allKeys;
  const columnWidths = calculateColumnWidths(data, columns, padding);

  const renderRow = (row: T, isHeader = false, rowIndex = -1) => (
    <Box key={isHeader ? 'header' : `row-${rowIndex}`} flexDirection="row">
      <SkeletonComponent>│</SkeletonComponent>
      {columns.map((column, colIndex) => {
        const key = String(column);
        const width = columnWidths[key] || 0;
        const value = isHeader ? column : row[column];
        const content = String(value || '');

        const leftPadding = ' '.repeat(padding);
        const rightPadding = ' '.repeat(width - content.length - padding);
        const paddedContent = `${leftPadding}${content}${rightPadding}`;

        return (
          <React.Fragment key={`cell-${isHeader ? 'header' : rowIndex}-${key}`}>
            {isHeader ? (
              <HeaderComponent column={key} row={row} isHeader>
                {paddedContent}
              </HeaderComponent>
            ) : (
              <CellComponent column={key} row={row}>
                {paddedContent}
              </CellComponent>
            )}
            <SkeletonComponent>│</SkeletonComponent>
          </React.Fragment>
        );
      })}
    </Box>
  );

  const renderBorder = (
    position: 'top' | 'middle' | 'bottom',
    rowIndex = -1,
  ) => {
    const chars = {
      top: { left: '┌', mid: '┬', right: '┐', line: '─' },
      middle: { left: '├', mid: '┼', right: '┤', line: '─' },
      bottom: { left: '└', mid: '┴', right: '┘', line: '─' },
    };

    const parts: React.ReactNode[] = [];

    parts.push(
      <SkeletonComponent key={`border-${position}-${rowIndex}-left`}>
        {chars[position].left}
      </SkeletonComponent>,
    );

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const key = String(column);
      const width = columnWidths[key] || 0;
      const line = chars[position].line.repeat(1);

      parts.push(
        // <SkeletonComponent key={`border-${position}-${rowIndex}-line-${i}`}>
        <Text key={`border-${position}-${rowIndex}-line-${i}`}>{line}</Text>,
        // </SkeletonComponent>,
      );

      if (i < columns.length - 1) {
        // parts.push(
        //   <SkeletonComponent key={`border-${position}-${rowIndex}-mid-${i}`}>
        //     {chars[position].mid}
        //   </SkeletonComponent>,
        // );
      }
    }

    // parts.push(
    //   <SkeletonComponent key={`border-${position}-${rowIndex}-right`}>
    //     {chars[position].right}
    //   </SkeletonComponent>,
    // );

    return (
      <Box
        key={`border-${position}-${rowIndex}`}
        flexDirection="row"
        flexGrow={1}
        width="100%"
        display="flex"
        minWidth={'100%'}
      >
        {parts}
      </Box>
    );
  };

  const headerData = columns.reduce(
    (acc, col) => {
      acc[col as string] = col;
      return acc;
    },
    {} as Record<string, unknown>,
  ) as T;

  return (
    <Box flexDirection="column">
      {renderBorder('top')}
      {/* {renderRow(headerData, true)} */}
      {/* {renderBorder('middle')} */}

      {/* {data.map((row, index) => (
        <Box key={`row-wrapper-${index}`} flexDirection="column">
          {renderRow(row, false, index)}
          {index < data.length - 1
            ? renderBorder('middle', index)
            : renderBorder('bottom')}
        </Box>
      ))} */}
    </Box>
  );
}

export default Table;
