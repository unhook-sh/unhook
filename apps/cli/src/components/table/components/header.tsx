import { Text } from 'ink';
import type { CellProps, ScalarDict } from '../types';

export function Header<T extends ScalarDict>({ children }: CellProps<T>) {
  return (
    <Text bold color="blue" wrap="truncate">
      {children}
    </Text>
  );
}
