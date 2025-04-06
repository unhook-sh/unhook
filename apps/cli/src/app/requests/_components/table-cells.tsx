import { Text } from 'ink';
import type { CellProps } from '~/components/table';

export function RequestTableHeader({ children }: CellProps) {
  return (
    <Text bold color="cyan">
      {children}
    </Text>
  );
}

export function RequestTableCell({ children, column, isSelected }: CellProps) {
  if (column === 'status') {
    const status = Number(String(children).trim());
    const color = status < 400 ? 'green' : 'red';
    return (
      <Text color={color} bold={isSelected}>
        {children}
      </Text>
    );
  }

  if (column === 'method') {
    return (
      <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
        {children}
      </Text>
    );
  }

  if (column === 'url') {
    return (
      <Text color={isSelected ? 'blue' : undefined} bold={isSelected}>
        {children}
      </Text>
    );
  }

  if (column === 'time') {
    return (
      <Text color={isSelected ? 'yellow' : 'gray'} bold={isSelected}>
        {children}
      </Text>
    );
  }

  return <Text bold={isSelected}>{children}</Text>;
}

export function RequestTableSkeleton({
  children,
}: React.PropsWithChildren<Record<string, unknown>>) {
  return <Text color="blue">{children}</Text>;
}
