import { describe, expect, it } from 'bun:test';
import {
  adjustWidthsToFit,
  applyConstraints,
  calculateColumnWidths,
  calculateContentWidths,
  calculateInitialWidths,
  getVisibleColumns,
  inferColumns,
  padContent,
} from './column-utils';
import type { ColumnDef } from './types';

interface TestData {
  [key: string]: string | number;
}

describe('calculateColumnWidths', () => {
  const columns: ColumnDef<TestData>[] = [
    { header: 'Name', id: 'name', minWidth: 5 },
    { header: 'Age', id: 'age', minWidth: 3 },
    { header: 'Email', id: 'email', minWidth: 5 },
  ];

  const data: TestData[] = [
    { age: 30, email: 'alice@example.com', name: 'Alice' },
    { age: 25, email: 'bob@example.com', name: 'Bob' },
  ];

  it('should calculate widths and expand to use available space', () => {
    const widths = calculateColumnWidths({
      columns,
      data,
      maxWidth: 80,
      padding: 1,
    });
    // With expansion, columns should use most of the available 80 width
    // Account for borders (4) and padding (6) = 70 available
    const totalWidth =
      (widths.name ?? 0) + (widths.age ?? 0) + (widths.email ?? 0);
    expect(totalWidth).toBeGreaterThan(60); // Should use most available space
  });

  it('should proportionally reduce widths when total exceeds maxWidth', () => {
    const widths = calculateColumnWidths({
      columns,
      data,
      maxWidth: 10,
      padding: 1,
    });
    expect(widths.name).toBeGreaterThanOrEqual(5); // Respects minWidth
    expect(widths.age).toBeGreaterThanOrEqual(3);
    expect(widths.email).toBeGreaterThanOrEqual(5);
  });

  it('should respect minWidth constraints', () => {
    const widths = calculateColumnWidths({
      columns,
      data,
      maxWidth: 5,
      padding: 1,
    });
    expect(widths.name).toBeGreaterThanOrEqual(5);
    expect(widths.age).toBeGreaterThanOrEqual(3);
    expect(widths.email).toBeGreaterThanOrEqual(5);
  });
});

describe('padContent', () => {
  it('should pad content correctly', () => {
    const padded = padContent({ content: 'test', padding: 1, width: 10 });
    // With centered padding: 3 spaces + 'test' + 3 spaces = 10 total
    expect(padded).toBe('   test   ');
  });
});

describe('inferColumns', () => {
  it('should infer columns from data', () => {
    const data = [
      { age: 30, name: 'Alice' },
      { age: 25, name: 'Bob' },
    ];
    const columns = inferColumns(data);
    expect(columns).toEqual(['name', 'age']);
  });
});

describe('calculateInitialWidths', () => {
  it('should calculate initial widths based on headers', () => {
    const columns: ColumnDef<TestData>[] = [
      { header: 'Name', id: 'name' },
      { header: 'Age', id: 'age' },
    ];
    const widths = calculateInitialWidths({ columns, padding: 1 });
    expect(widths).toEqual({ age: 5, name: 6 });
  });
});

describe('calculateContentWidths', () => {
  it('should calculate content widths based on data', () => {
    const columns: ColumnDef<TestData>[] = [
      { header: 'Name', id: 'name' },
      { header: 'Age', id: 'age' },
    ];
    const data: TestData[] = [
      { age: 30, name: 'Alice' },
      { age: 25, name: 'Bob' },
    ];
    const initialWidths = calculateInitialWidths({ columns, padding: 1 });
    const widths = calculateContentWidths({
      columns,
      data,
      initialWidths,
      padding: 1,
    });
    // Name width should be at least 6 (header) or 7 (content 'Alice' + padding)
    expect(widths.name).toBeGreaterThanOrEqual(6);
    expect(widths.age).toBeGreaterThanOrEqual(4); // '30' + padding
  });
});

describe('applyConstraints', () => {
  it('should apply min and max width constraints', () => {
    const columns: ColumnDef<TestData>[] = [
      { header: 'Name', id: 'name', maxWidth: 10, minWidth: 5 },
      { header: 'Age', id: 'age', maxWidth: 5, minWidth: 3 },
    ];
    const initialWidths = { age: 2, name: 12 };
    const widths = applyConstraints({
      columns,
      widths: initialWidths,
    });
    expect(widths.name).toBe(10); // Capped at maxWidth
    expect(widths.age).toBe(3); // Raised to minWidth
  });
});

describe('adjustWidthsToFit', () => {
  it('should adjust widths to fit within available width', () => {
    const widths = { age: 5, name: 10 };
    const adjustedWidths = adjustWidthsToFit({
      availableWidth: 12,
      widths,
    });
    expect(adjustedWidths.name).toBeLessThanOrEqual(10);
    expect(adjustedWidths.age).toBeLessThanOrEqual(5);
  });

  it('should expand widths when extra space is available', () => {
    const widths = { age: 5, name: 10 };
    const adjustedWidths = adjustWidthsToFit({
      availableWidth: 30,
      widths,
    });
    // Total should use all available space
    const totalWidth = (adjustedWidths.name ?? 0) + (adjustedWidths.age ?? 0);
    expect(totalWidth).toBe(30);
    // Each column should grow proportionally
    expect(adjustedWidths.name).toBeGreaterThan(10);
    expect(adjustedWidths.age).toBeGreaterThan(5);
  });

  it('should respect maxWidth constraints when expanding', () => {
    const widths = { age: 5, name: 10 };
    const columns: ColumnDef<TestData>[] = [
      { header: 'Name', id: 'name', maxWidth: 15 },
      { header: 'Age', id: 'age' },
    ];
    const adjustedWidths = adjustWidthsToFit({
      availableWidth: 30,
      columns,
      widths,
    });
    // Name should not exceed maxWidth
    expect(adjustedWidths.name).toBeLessThanOrEqual(15);
    // Age should get the remaining space
    expect(adjustedWidths.age).toBe(15);
  });

  it('should not shrink columns below their minWidth', () => {
    const widths = { age: 20, name: 20 };
    const columns: ColumnDef<TestData>[] = [
      { header: 'Name', id: 'name', minWidth: 5 },
      { header: 'Age', id: 'age', minWidth: 10 },
    ];
    // availableWidth is much less than total widths, so both should shrink, but not below minWidth
    const adjustedWidths = adjustWidthsToFit({
      availableWidth: 20,
      columns, // less than sum of minWidths (15), so will hit minWidth
      widths: { ...widths },
    });
    expect(adjustedWidths.name ?? 0).toBeGreaterThanOrEqual(5);
    expect(adjustedWidths.age ?? 0).toBeGreaterThanOrEqual(10);
    // Should sum to availableWidth or as close as possible without violating minWidth
    expect(
      (adjustedWidths.name ?? 0) + (adjustedWidths.age ?? 0),
    ).toBeLessThanOrEqual(20);
  });
});

describe('getVisibleColumns', () => {
  it('should show all columns when there is enough width', () => {
    const columns: ColumnDef<TestData>[] = [
      { header: 'Name', id: 'name', minWidth: 10, priority: 1 },
      { header: 'Age', id: 'age', minWidth: 5, priority: 2 },
      { header: 'Email', id: 'email', minWidth: 15, priority: 3 },
    ];
    const visibleCols = getVisibleColumns({
      availableWidth: 100,
      columns,
      padding: 1,
    });
    expect(visibleCols).toHaveLength(3);
  });

  it('should hide lower priority columns when width is limited', () => {
    const columns: ColumnDef<TestData>[] = [
      { header: 'Name', id: 'name', minWidth: 20, priority: 1 },
      { header: 'Age', id: 'age', minWidth: 10, priority: 3 },
      { header: 'Email', id: 'email', minWidth: 20, priority: 2 },
    ];
    const visibleCols = getVisibleColumns({
      availableWidth: 50,
      columns,
      padding: 1,
    });
    expect(visibleCols).toHaveLength(2);
    expect(visibleCols[0]?.id).toBe('name');
    expect(visibleCols[1]?.id).toBe('email');
  });

  it('should show at least one column even if width is very small', () => {
    const columns: ColumnDef<TestData>[] = [
      { header: 'Name', id: 'name', minWidth: 50, priority: 1 },
      { header: 'Age', id: 'age', minWidth: 50, priority: 2 },
    ];
    const visibleCols = getVisibleColumns({
      availableWidth: 10,
      columns,
      padding: 1,
    });
    expect(visibleCols).toHaveLength(1);
    expect(visibleCols[0]?.id).toBe('name');
  });

  it('should not overestimate available width due to border miscount', () => {
    // 2 columns, minWidth 10 each, padding 1 each
    // Borders needed: 2 columns + 1 = 3
    // Each column: minWidth (10) + padding*2 (2) = 12
    // Total for 2 columns: 24 + 3 (borders) = 27
    const columns: ColumnDef<TestData>[] = [
      { header: 'A', id: 'a', minWidth: 10, priority: 1 },
      { header: 'B', id: 'b', minWidth: 10, priority: 2 },
    ];
    // If availableWidth is exactly 27, both columns should fit
    let visibleCols = getVisibleColumns({
      availableWidth: 27,
      columns,
      padding: 1,
    });
    expect(visibleCols).toHaveLength(2);
    // If availableWidth is 26, only one column should fit
    visibleCols = getVisibleColumns({
      availableWidth: 26,
      columns,
      padding: 1,
    });
    expect(visibleCols).toHaveLength(1);
    expect(visibleCols[0]?.id).toBe('a');
  });
});
