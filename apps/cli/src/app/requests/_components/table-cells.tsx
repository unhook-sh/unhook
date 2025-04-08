import type { RequestType } from '@unhook/db/schema';
import { Text } from 'ink';
import type { CellProps } from '~/components/table';

export function RequestTableHeader({ children }: CellProps<RequestType>) {
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
}: CellProps<RequestType>) {
  if (column === 'status') {
    let color = isSelected ? 'cyan' : 'white';

    if (row.status === 'pending') {
      color = 'yellow';
    } else if (row.status === 'completed') {
      color = 'green';
    } else if (row.status === 'failed') {
      color = 'red';
    }

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

  if (column === 'responseCode') {
    let color = isSelected ? 'cyan' : 'green';

    if (row.response?.status && row.response?.status >= 500) {
      color = 'red';
    } else if (row.response?.status && row.response?.status >= 400) {
      color = 'yellow';
    }

    return (
      <Text color={color} dimColor={!isSelected} bold={isSelected}>
        {children}
      </Text>
    );
  }

  if (column === 'responseTimeMs') {
    let color = isSelected ? 'cyan' : 'white';
    const responseTimeMs = row.responseTimeMs;

    if (responseTimeMs < 500) {
      color = 'green';
    } else if (responseTimeMs < 1000) {
      color = 'yellow';
    } else {
      color = 'red';
    }

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
