import { Text } from 'ink';
import type { CellProps } from '~/components/table';

export function RequestTableHeader({ children }: CellProps) {
  return (
    <Text bold color="cyan">
      {children}
    </Text>
  );
}

export function RequestTableCell({ children, column, row }: CellProps) {
  if (column === 'status') {
    const status = Number(String(children).trim());
    const color = status < 400 ? 'green' : 'red';
    return <Text color={color}>{children}</Text>;
  }

  if (column === 'method' && row.isSelected) {
    return (
      <Text bold color="cyan">
        {children}
      </Text>
    );
  }

  if (column === 'selected' && String(children).trim() === '→') {
    return <Text color="yellow">{children}</Text>;
  }

  if (row.isSelected) {
    return <Text bold>{children}</Text>;
  }

  return <Text>{children}</Text>;
}

export function RequestTableSkeleton({
  children,
}: React.PropsWithChildren<Record<string, unknown>>) {
  return <Text color="blue">{children}</Text>;
}
