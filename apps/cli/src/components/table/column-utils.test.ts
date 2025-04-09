import { describe, expect, it } from 'bun:test';
import {
  adjustWidthsToFit,
  applyConstraints,
  calculateColumnWidths,
  calculateContentWidths,
  calculateInitialWidths,
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

  it('should calculate widths with default maxWidth', () => {
    const widths = calculateColumnWidths({
      data,
      columns,
      padding: 1,
      maxWidth: 80,
    });
    expect(widths).toEqual({ name: 7, age: 5, email: 7 });
  });

  it('should proportionally reduce widths when total exceeds maxWidth', () => {
    const widths = calculateColumnWidths({
      data,
      columns,
      padding: 1,
      maxWidth: 10,
    });
    expect(widths.name).toBeLessThanOrEqual(5);
    expect(widths.age).toBeLessThanOrEqual(3);
    expect(widths.email).toBeLessThanOrEqual(5);
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
    expect(padded).toBe('  test    ');
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
    expect(widths).toEqual({ name: 7, age: 5 });
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
    expect(widths).toEqual({ name: 10, age: 5 });
  });
});

describe('adjustWidthsToFit', () => {
  it('should adjust widths to fit within available width', () => {
    const widths = { name: 10, age: 5 };
    const adjustedWidths = adjustWidthsToFit({ widths, availableWidth: 12 });
    expect(adjustedWidths.name).toBeLessThanOrEqual(10);
    expect(adjustedWidths.age).toBeLessThanOrEqual(5);
  });
});
