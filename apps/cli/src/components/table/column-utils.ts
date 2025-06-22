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

  return adjustWidthsToFit({
    widths: constrainedWidths,
    availableWidth,
    columns,
  });
}

export function calculateInitialWidths<T>({
  columns,
  padding,
}: {
  columns: ColumnDef<T>[];
  padding: number;
}): Record<string, number> {
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

export function adjustWidthsToFit<T>({
  widths,
  availableWidth,
  columns,
}: {
  widths: Record<string, number>;
  availableWidth: number;
  columns?: ColumnDef<T>[];
}): Record<string, number> {
  const totalContentWidth = Object.values(widths).reduce(
    (sum, width) => sum + width,
    0,
  );

  if (totalContentWidth > availableWidth) {
    // Shrink columns proportionally when content exceeds available width
    const ratio = availableWidth / totalContentWidth;
    // Build minWidths map if columns are provided
    const minWidths: Record<string, number> = {};
    if (columns) {
      for (const column of columns) {
        minWidths[column.id] = column.minWidth ?? 1;
      }
    }
    for (const key in widths) {
      if (widths[key] !== undefined) {
        // Use minWidth from columns if available, else default to 1
        const minWidth = columns ? (minWidths[key] ?? 1) : 1;
        widths[key] = Math.max(Math.floor(widths[key] * ratio), minWidth);
      }
    }
  } else if (totalContentWidth < availableWidth) {
    // Expand columns proportionally when we have extra space
    const extraSpace = availableWidth - totalContentWidth;

    // Calculate max widths for each column if columns are provided
    const maxWidths: Record<string, number | undefined> = {};
    if (columns) {
      for (const column of columns) {
        maxWidths[column.id] = column.maxWidth;
      }
    }

    // Calculate how much each column can grow
    const growthPotential: Record<string, number> = {};
    let totalGrowthPotential = 0;

    for (const key in widths) {
      if (widths[key] !== undefined) {
        const currentWidth = widths[key];
        const maxWidth = maxWidths[key];
        const potential = maxWidth
          ? Math.max(0, maxWidth - currentWidth)
          : Number.POSITIVE_INFINITY;
        growthPotential[key] = potential;
        if (potential !== Number.POSITIVE_INFINITY) {
          totalGrowthPotential += potential;
        }
      }
    }

    // If we have constrained growth potential, use it; otherwise distribute proportionally
    if (totalGrowthPotential > 0 && totalGrowthPotential < extraSpace) {
      // Some columns have max width constraints
      // First, grow constrained columns to their max
      for (const key in widths) {
        if (
          widths[key] !== undefined &&
          growthPotential[key] !== Number.POSITIVE_INFINITY &&
          growthPotential[key] !== undefined
        ) {
          widths[key] += growthPotential[key];
        }
      }

      // Distribute remaining space among unconstrained columns
      const remainingSpace = extraSpace - totalGrowthPotential;
      const unconstrainedColumns = Object.keys(widths).filter(
        (key) => growthPotential[key] === Number.POSITIVE_INFINITY,
      );

      if (unconstrainedColumns.length > 0) {
        const spacePerColumn = Math.floor(
          remainingSpace / unconstrainedColumns.length,
        );
        for (const key of unconstrainedColumns) {
          if (widths[key] !== undefined) {
            widths[key] += spacePerColumn;
          }
        }
      }
    } else {
      // Distribute space proportionally based on current widths
      for (const key in widths) {
        if (widths[key] !== undefined) {
          const currentWidth = widths[key];
          const proportion = currentWidth / totalContentWidth;
          const additionalWidth = Math.floor(extraSpace * proportion);
          const maxWidth = maxWidths[key];

          if (maxWidth) {
            widths[key] = Math.min(currentWidth + additionalWidth, maxWidth);
          } else {
            widths[key] = currentWidth + additionalWidth;
          }
        }
      }
    }
  }

  return widths;
}

export function padContent({
  content,
  width,
  padding,
}: {
  content: string;
  width: number;
  padding: number;
}): string {
  // Calculate available space for content
  const _contentWidth = width - padding * 2;

  // Add padding
  const totalPadding = Math.max(0, width - content.length);
  const leftPadding = Math.max(0, Math.floor(totalPadding / 2));
  const rightPadding = Math.max(0, totalPadding - leftPadding);
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

export function truncateText(text: string | null, maxWidth: number) {
  if (!text) return '-';
  if (text.length <= maxWidth) return text;
  return `${text.slice(0, maxWidth - 1)}…`;
}

export function getSelectedColor({
  isSelected,
  defaultColor = 'gray',
  selectedColor = 'white',
}: {
  isSelected: boolean;
  defaultColor?: string;
  selectedColor?: string;
}): string {
  return isSelected ? selectedColor : defaultColor;
}

/**
 * Determine which columns to display based on available width and column priorities.
 * Columns with lower priority values are shown first.
 */
export function getVisibleColumns<T extends ScalarDict>({
  columns,
  availableWidth,
  padding,
}: {
  columns: ColumnDef<T>[];
  availableWidth: number;
  padding: number;
}): ColumnDef<T>[] {
  // Sort columns by priority (lower priority = more important)
  const sortedColumns = [...columns].sort((a, b) => {
    const priorityA = a.priority ?? 100;
    const priorityB = b.priority ?? 100;
    return priorityA - priorityB;
  });

  const visibleColumns: ColumnDef<T>[] = [];

  for (const column of sortedColumns) {
    const candidateColumns = [...visibleColumns, column];
    const totalWidth =
      candidateColumns.reduce(
        (sum, col) => sum + (col.minWidth || 10) + padding * 2,
        0,
      ) +
      candidateColumns.length +
      1; // borders: N columns + 1

    if (totalWidth <= availableWidth) {
      visibleColumns.push(column);
    } else {
      break;
    }
  }

  // Ensure at least one column is visible
  if (visibleColumns.length === 0 && sortedColumns.length > 0) {
    const firstColumn = sortedColumns[0];
    if (firstColumn) {
      visibleColumns.push(firstColumn);
    }
  }

  return visibleColumns;
}
