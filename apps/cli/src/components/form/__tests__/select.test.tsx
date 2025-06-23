import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { render } from 'ink-testing-library';
import type { ReactElement } from 'react';
import { z } from 'zod';
import type { MenuItem } from '../../select-input';
import { FormProvider } from '../form';
import { FormSelect } from '../select';

// const { connectToDevTools } = await import('react-devtools-core/backend');
// connectToDevTools({
//   host: 'localhost',
//   port: 8097,
//   isAppActive: () => true,
//   websocket: true,
//   resolveRNStyle: null,
// });

const mockItems: MenuItem<string>[] = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
];

const mockSchema = z.object({
  'test-select': z.string().min(1, 'Required'),
});

const mockOnSubmit = mock(() => {});
const mockOnSelect = mock(() => {});

const renderWithProvider = (ui: ReactElement) => {
  return render(
    <FormProvider onSubmit={mockOnSubmit} schema={mockSchema}>
      {ui}
    </FormProvider>,
  );
};

describe('FormSelect', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnSelect.mockClear();
  });

  it('should render select input when active', () => {
    const { lastFrame } = renderWithProvider(
      <FormSelect id="test-select" items={mockItems} />,
    );

    expect(lastFrame()).toContain('Option 1');
    expect(lastFrame()).toContain('Option 2');
    expect(lastFrame()).toContain('Option 3');
  });

  it('should not render when not active', () => {
    const { lastFrame } = renderWithProvider(
      <FormSelect id="test-select" items={mockItems} />,
    );

    // Initially should not show since it's not active
    expect(lastFrame()).not.toContain('Option 1');
  });

  it('should show selected value when complete', () => {
    const { lastFrame } = renderWithProvider(
      <FormSelect id="test-select" items={mockItems} defaultValue="1" />,
    );

    expect(lastFrame()).toContain('Option 1');
  });

  it('should call onSelect when an option is selected', () => {
    const { stdin } = renderWithProvider(
      <FormSelect id="test-select" items={mockItems} onSelect={mockOnSelect} />,
    );

    // Simulate selecting the first option
    stdin.write('\r');

    expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
  });

  it('should show error message when validation fails', () => {
    const { lastFrame } = renderWithProvider(
      <FormSelect id="test-select" items={mockItems} />,
    );

    // The error message should be visible since no value is selected
    expect(lastFrame()).toContain('Required');
  });

  it('should show hotkeys when showHotkeys is true', () => {
    const { lastFrame } = renderWithProvider(
      <FormSelect id="test-select" items={mockItems} showHotkeys />,
    );

    expect(lastFrame()).toContain('1)');
    expect(lastFrame()).toContain('2)');
    expect(lastFrame()).toContain('3)');
  });

  it('should throw error when used outside FormProvider', () => {
    expect(() => {
      render(<FormSelect id="test-select" items={mockItems} />);
    }).toThrow('FormSelect must be used within a FormProvider');
  });
});
