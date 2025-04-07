import { Text } from 'ink';
import type { CellProps } from '~/components/table';

export function RequestTableHeader({ children }: CellProps) {
  return (
    <Text bold color="cyan">
      {children}
    </Text>
  );
}

export function RequestTableCell({
  children,
  column,
  isSelected,
  row,
}: CellProps) {
  if (column === 'status') {
    const status = Number(String(children).trim());
    const color = isSelected ? 'cyan' : status < 400 ? 'green' : 'red';
    return (
      <Text color={color} dimColor={!isSelected} bold={isSelected}>
        {children}
      </Text>
    );
  }

  if (column === 'method') {
    const color = isSelected ? 'cyan' : 'white';
    return (
      <Text color={color} dimColor={!isSelected} bold={isSelected}>
        {children}
      </Text>
    );
  }

  if (column === 'url') {
    const color = isSelected ? 'cyan' : 'white';
    return (
      <Text color={color} dimColor={!isSelected} bold={isSelected}>
        {children}
      </Text>
    );
  }

  if (column === 'time') {
    const color = isSelected ? 'cyan' : 'gray';
    return (
      <Text color={color} dimColor={!isSelected} bold={isSelected}>
        {children}
      </Text>
    );
  }

  return (
    <Text
      color={isSelected ? 'cyan' : undefined}
      dimColor={!isSelected}
      bold={isSelected}
    >
      {children}
    </Text>
  );
}

export function RequestTableSkeleton({
  children,
}: React.PropsWithChildren<Record<string, unknown>>) {
  return <Text color="blue">{children}</Text>;
}
