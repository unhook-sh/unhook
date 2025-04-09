import type { RequestType } from '@unhook/db/schema';
import { differenceInMinutes, format, formatDistanceToNow } from 'date-fns';
import { Text } from 'ink';
import type { ColumnDef } from '~/components/table/types';

function formatRequestTime(date: Date) {
  const now = new Date();
  const diffInMinutes = differenceInMinutes(now, date);

  if (diffInMinutes < 1) {
    return formatDistanceToNow(date, { addSuffix: true, includeSeconds: true });
  }

  return format(date, 'MMM d, HH:mm:ss');
}

function tryDecodeBase64(str: string): string {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

function truncateText(text: string, maxWidth: number) {
  if (text.length <= maxWidth) return text;
  return `${text.slice(0, maxWidth - 1)}…`;
}

function getNestedField(
  obj: Record<string, unknown>,
  path: string,
): string | null {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, part) => acc && (acc as Record<string, unknown>)[part],
      obj,
    ) as string | null;
}

export const requestColumns: ColumnDef<RequestType>[] = [
  {
    id: 'status',
    header: 'Status',
    minWidth: 7,
    cell: ({ row, isSelected, width }) => {
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
          {truncateText(row.status, width)}
        </Text>
      );
    },
  },
  {
    id: 'method',
    header: 'Method',
    minWidth: 4,
    cell: ({ row, isSelected, width }) => {
      const color = isSelected ? 'cyan' : 'white';
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(row.request.method, width)}
        </Text>
      );
    },
  },
  {
    id: 'url',
    header: 'URL',
    minWidth: 25,
    cell: ({ row, isSelected, width }) => {
      const color = isSelected ? 'cyan' : 'white';
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(row.request.url, width)}
        </Text>
      );
    },
  },
  {
    id: 'responseCode',
    header: 'Code',
    minWidth: 4,
    cell: ({ row, isSelected, width }) => {
      let color = isSelected ? 'cyan' : 'green';
      const responseCode = row.response?.status;

      if (responseCode && responseCode >= 500) {
        color = 'red';
      } else if (responseCode && responseCode >= 400) {
        color = 'yellow';
      }

      if (responseCode === 0 || responseCode === undefined) {
        color = 'gray';
      }

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(String(responseCode || '-'), width)}
        </Text>
      );
    },
  },
  {
    id: 'responseTimeMs',
    header: 'Time',
    minWidth: 6,
    cell: ({ row, isSelected, width }) => {
      let color = isSelected ? 'cyan' : 'white';
      const responseTimeMs = row.responseTimeMs;

      if (responseTimeMs < 500) {
        color = 'green';
      } else if (responseTimeMs < 1000) {
        color = 'yellow';
      } else {
        color = 'red';
      }

      if (responseTimeMs === 0 || responseTimeMs === undefined) {
        color = 'gray';
      }

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {responseTimeMs === 0 || responseTimeMs === undefined
            ? '-'
            : truncateText(`${responseTimeMs}ms`, width)}
        </Text>
      );
    },
  },
  {
    id: 'event',
    header: 'Event',
    minWidth: 35,
    cell: ({ row, isSelected, width }) => {
      const color = isSelected ? 'cyan' : 'gray';
      const decodedBody = row.request.body
        ? tryDecodeBase64(row.request.body)
        : null;
      let event = null;
      try {
        const knownEventTypeNames = ['event', 'type', 'event_type'];
        const parsedBody = decodedBody ? JSON.parse(decodedBody) : null;

        for (const name of knownEventTypeNames) {
          const value = getNestedField(parsedBody, name);
          if (typeof value === 'string') {
            event = value;
            break;
          }
        }
      } catch {
        // Do nothing
      }
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(event ?? '', width)}
        </Text>
      );
    },
  },
  {
    id: 'agent',
    header: 'Agent',
    minWidth: 25,
    cell: ({ row, isSelected, width }) => {
      const color = isSelected ? 'cyan' : 'gray';
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(
            row.request.headers['user-agent']?.split(' ')[0] ?? '',
            width,
          )}
        </Text>
      );
    },
  },
  {
    id: 'time',
    header: 'Created',
    minWidth: 15,
    cell: ({ row, isSelected, width }) => {
      const color = isSelected ? 'cyan' : 'gray';
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(formatRequestTime(new Date(row.createdAt)), width)}
        </Text>
      );
    },
  },
];
