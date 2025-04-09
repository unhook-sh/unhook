import { Text } from 'ink';
import { useFocus } from 'ink';
import type { CellProps, ScalarDict } from '../types';

export function Cell<T extends ScalarDict>({
  children,
  isSelected,
  rowId,
}: CellProps<T>) {
  const { isFocused } = useFocus({ id: rowId });
  return (
    <Text color={isSelected ? (isFocused ? 'green' : 'gray') : undefined}>
      {' '}
      {children}
    </Text>
  );
}
