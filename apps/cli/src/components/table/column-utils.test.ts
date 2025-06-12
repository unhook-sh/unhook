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
    { id: 'name', header: 'Name', minWidth: 5 },
    { id: 'age', header: 'Age', minWidth: 3 },
    { id: 'email', header: 'Email', minWidth: 5 },
  ];

  const data: TestData[] = [
    { name: 'Alice', age: 30, email: 'alice@example.com' },
    { name: 'Bob', age: 25, email: 'bob@example.com' },
  ];

  it('should calculate widths and expand to use available space', () => {
    const widths = calculateColumnWidths({
      data,
      columns,
      padding: 1,
      maxWidth: 80,
    });
    // With expansion, columns should use most of the available 80 width
    // Account for borders (4) and padding (6) = 70 available
    const totalWidth =
      (widths.name ?? 0) + (widths.age ?? 0) + (widths.email ?? 0);
    expect(totalWidth).toBeGreaterThan(60); // Should use most available space
  });

  it('should proportionally reduce widths when total exceeds maxWidth', () => {
    const widths = calculateColumnWidths({
      data,
      columns,
      padding: 1,
      maxWidth: 10,
    });
    expect(widths.name).toBeGreaterThanOrEqual(5); // Respects minWidth
    expect(widths.age).toBeGreaterThanOrEqual(3);
    expect(widths.email).toBeGreaterThanOrEqual(5);
  });

  it('should respect minWidth constraints', () => {
    const widths = calculateColumnWidths({
      data,
      columns,
      padding: 1,
      maxWidth: 5,
    });
    expect(widths.name).toBeGreaterThanOrEqual(5);
    expect(widths.age).toBeGreaterThanOrEqual(3);
    expect(widths.email).toBeGreaterThanOrEqual(5);
  });
});

describe('padContent', () => {
  it('should pad content correctly', () => {
    const padded = padContent({ content: 'test', width: 10, padding: 1 });
    // With centered padding: 3 spaces + 'test' + 3 spaces = 10 total
    expect(padded).toBe('   test   ');
  });
});

describe('inferColumns', () => {
  it('should infer columns from data', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    const columns = inferColumns(data);
    expect(columns).toEqual(['name', 'age']);
  });
});

describe('calculateInitialWidths', () => {
  it('should calculate initial widths based on headers', () => {
    const columns: ColumnDef<TestData>[] = [
      { id: 'name', header: 'Name' },
      { id: 'age', header: 'Age' },
    ];
    const widths = calculateInitialWidths({ columns, padding: 1 });
    expect(widths).toEqual({ name: 6, age: 5 });
  });
});

describe('calculateContentWidths', () => {
  it('should calculate content widths based on data', () => {
    const columns: ColumnDef<TestData>[] = [
      { id: 'name', header: 'Name' },
      { id: 'age', header: 'Age' },
    ];
    const data: TestData[] = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    const initialWidths = calculateInitialWidths({ columns, padding: 1 });
    const widths = calculateContentWidths({
      data,
      columns,
      padding: 1,
      initialWidths,
    });
    // Name width should be at least 6 (header) or 7 (content 'Alice' + padding)
    expect(widths.name).toBeGreaterThanOrEqual(6);
    expect(widths.age).toBeGreaterThanOrEqual(4); // '30' + padding
  });
});

describe('applyConstraints', () => {
  it('should apply min and max width constraints', () => {
    const columns: ColumnDef<TestData>[] = [
      { id: 'name', header: 'Name', minWidth: 5, maxWidth: 10 },
      { id: 'age', header: 'Age', minWidth: 3, maxWidth: 5 },
    ];
    const initialWidths = { name: 12, age: 2 };
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
    const widths = { name: 10, age: 5 };
    const adjustedWidths = adjustWidthsToFit({
      widths,
      availableWidth: 12,
    });
    expect(adjustedWidths.name).toBeLessThanOrEqual(10);
    expect(adjustedWidths.age).toBeLessThanOrEqual(5);
  });

  it('should expand widths when extra space is available', () => {
    const widths = { name: 10, age: 5 };
    const adjustedWidths = adjustWidthsToFit({
      widths,
      availableWidth: 30,
    });
    // Total should use all available space
    const totalWidth = (adjustedWidths.name ?? 0) + (adjustedWidths.age ?? 0);
    expect(totalWidth).toBe(30);
    // Each column should grow proportionally
    expect(adjustedWidths.name).toBeGreaterThan(10);
    expect(adjustedWidths.age).toBeGreaterThan(5);
  });

  it('should respect maxWidth constraints when expanding', () => {
    const widths = { name: 10, age: 5 };
    const columns: ColumnDef<TestData>[] = [
      { id: 'name', header: 'Name', maxWidth: 15 },
      { id: 'age', header: 'Age' },
    ];
    const adjustedWidths = adjustWidthsToFit({
      widths,
      availableWidth: 30,
      columns,
    });
    // Name should not exceed maxWidth
    expect(adjustedWidths.name).toBeLessThanOrEqual(15);
    // Age should get the remaining space
    expect(adjustedWidths.age).toBe(15);
  });

  it('should not shrink columns below their minWidth', () => {
    const widths = { name: 20, age: 20 };
    const columns: ColumnDef<TestData>[] = [
      { id: 'name', header: 'Name', minWidth: 5 },
      { id: 'age', header: 'Age', minWidth: 10 },
    ];
    // availableWidth is much less than total widths, so both should shrink, but not below minWidth
    const adjustedWidths = adjustWidthsToFit({
      widths: { ...widths },
      availableWidth: 20, // less than sum of minWidths (15), so will hit minWidth
      columns,
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
      { id: 'name', header: 'Name', minWidth: 10, priority: 1 },
      { id: 'age', header: 'Age', minWidth: 5, priority: 2 },
      { id: 'email', header: 'Email', minWidth: 15, priority: 3 },
    ];
    const visibleCols = getVisibleColumns({
      columns,
      availableWidth: 100,
      padding: 1,
    });
    expect(visibleCols).toHaveLength(3);
  });

  it('should hide lower priority columns when width is limited', () => {
    const columns: ColumnDef<TestData>[] = [
      { id: 'name', header: 'Name', minWidth: 20, priority: 1 },
      { id: 'age', header: 'Age', minWidth: 10, priority: 3 },
      { id: 'email', header: 'Email', minWidth: 20, priority: 2 },
    ];
    const visibleCols = getVisibleColumns({
      columns,
      availableWidth: 50,
      padding: 1,
    });
    expect(visibleCols).toHaveLength(2);
    expect(visibleCols[0]?.id).toBe('name');
    expect(visibleCols[1]?.id).toBe('email');
  });

  it('should show at least one column even if width is very small', () => {
    const columns: ColumnDef<TestData>[] = [
      { id: 'name', header: 'Name', minWidth: 50, priority: 1 },
      { id: 'age', header: 'Age', minWidth: 50, priority: 2 },
    ];
    const visibleCols = getVisibleColumns({
      columns,
      availableWidth: 10,
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
      { id: 'a', header: 'A', minWidth: 10, priority: 1 },
      { id: 'b', header: 'B', minWidth: 10, priority: 2 },
    ];
    // If availableWidth is exactly 27, both columns should fit
    let visibleCols = getVisibleColumns({
      columns,
      availableWidth: 27,
      padding: 1,
    });
    expect(visibleCols).toHaveLength(2);
    // If availableWidth is 26, only one column should fit
    visibleCols = getVisibleColumns({
      columns,
      availableWidth: 26,
      padding: 1,
    });
    expect(visibleCols).toHaveLength(1);
    expect(visibleCols[0]?.id).toBe('a');
  });
});
