import type { ColumnDef, ScalarDict } from './types';

export function calculateColumnWidths<T extends ScalarDict>({
  data,
  columns,
  padding,
  maxWidth,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  padding: number;
  maxWidth: number;
}): Record<string, number> {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
    maxWidth = 80; // Default to 80 columns if we don't have a valid width
  }

  const borderChars = columns.length + 1; // +1 for outer borders
  const availableWidth = maxWidth - borderChars - padding * 2 * columns.length;

  const initialWidths = calculateInitialWidths({ columns, padding });
  const contentWidths = calculateContentWidths({
    data,
    columns,
    padding,
    initialWidths,
  });
  const constrainedWidths = applyConstraints({
    columns,
    widths: contentWidths,
  });

  return adjustWidthsToFit({ widths: constrainedWidths, availableWidth });
}

export function calculateInitialWidths<T>({
  columns,
  padding,
}: { columns: ColumnDef<T>[]; padding: number }): Record<string, number> {
  const widths: Record<string, number> = {};
  for (const column of columns) {
    const headerContent =
      typeof column.header === 'string' ? column.header : column.id;
    widths[column.id] = headerContent.length + padding * 2;
  }
  return widths;
}

export function calculateContentWidths<T>({
  data,
  columns,
  padding,
  initialWidths,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  padding: number;
  initialWidths: Record<string, number>;
}): Record<string, number> {
  const widths = { ...initialWidths };
  for (const row of data) {
    for (const column of columns) {
      const value = column.accessorFn
        ? column.accessorFn(row)
        : column.accessorKey
          ? row[column.accessorKey]
          : '';

      if (value != null) {
        const content = String(value || '');
        const contentWidth = content.length + padding * 2;
        widths[column.id] = Math.max(widths[column.id] || 0, contentWidth);
      }
    }
  }
  return widths;
}

export function applyConstraints<T>({
  columns,
  widths,
}: {
  columns: ColumnDef<T>[];
  widths: Record<string, number>;
}): Record<string, number> {
  for (const column of columns) {
    if (typeof column.minWidth === 'number') {
      const minWidth = column.minWidth;
      widths[column.id] = Math.max(widths[column.id] || 0, minWidth);
    }

    if (typeof column.maxWidth === 'number') {
      const maxWidth = column.maxWidth;
      widths[column.id] = Math.min(widths[column.id] || 0, maxWidth);
    }
  }
  return widths;
}

export function adjustWidthsToFit({
  widths,
  availableWidth,
}: { widths: Record<string, number>; availableWidth: number }): Record<
  string,
  number
> {
  const totalContentWidth = Object.values(widths).reduce(
    (sum, width) => sum + width,
    0,
  );

  if (totalContentWidth > availableWidth) {
    const ratio = availableWidth / totalContentWidth;
    for (const key in widths) {
      if (widths[key] !== undefined) {
        const minWidth = widths[key];
        widths[key] = Math.max(Math.floor(widths[key] * ratio), minWidth);
      }
    }
  }

  return widths;
}

export function padContent({
  content,
  width,
  padding,
}: { content: string; width: number; padding: number }): string {
  // Calculate available space for content
  const _contentWidth = width - padding * 2;

  // Add padding
  const totalPadding = width - content.length;
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;
  return ' '.repeat(leftPadding) + content + ' '.repeat(rightPadding);
}

export function inferColumns<T extends ScalarDict>(data: T[]): (keyof T)[] {
  const keys = new Set<keyof T>();
  for (const row of data) {
    for (const key of Object.keys(row)) {
      keys.add(key as keyof T);
    }
  }
  return Array.from(keys);
}
