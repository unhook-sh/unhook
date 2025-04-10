import type { RequestType } from '@unhook/db/schema';
import { differenceInMinutes, format, formatDistanceToNow } from 'date-fns';
import figureSet from 'figures';
import { Text } from 'ink';
import { Spinner } from '~/components/spinner';
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
    header: '',
    minWidth: 3,
    cell: ({ row, isSelected, width }) => {
      const color = isSelected ? 'cyan' : 'white';

      if (row.status === 'pending') {
        return <Spinner dimColor={!isSelected} bold={isSelected} />;
      }

      if (
        row.status === 'completed' &&
        row.response &&
        row.response.status >= 200 &&
        row.response.status < 300
      ) {
        return (
          <Text color="green" dimColor={!isSelected} bold={isSelected}>
            {figureSet.circleFilled}
          </Text>
        );
      }

      if (
        row.response &&
        row.response.status >= 400 &&
        row.response.status < 500
      ) {
        return (
          <Text color="yellow" dimColor={!isSelected} bold={isSelected}>
            {figureSet.circle}
          </Text>
        );
      }

      if (
        row.status === 'failed' ||
        (row.status === 'completed' &&
          row.response &&
          (row.response.status < 200 || row.response.status >= 300))
      ) {
        return (
          <Text color="red" dimColor={!isSelected} bold={isSelected}>
            {figureSet.circle}
          </Text>
        );
      }

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(row.status, width)}
        </Text>
      );
    },
  },
  {
    id: 'time',
    header: 'Created',
    minWidth: 20,
    cell: ({ row, isSelected, width }) => {
      const color = isSelected ? 'cyan' : 'gray';
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(formatRequestTime(new Date(row.createdAt)), width)}
        </Text>
      );
    },
  },
  // {
  //   id: 'expired',
  //   header: 'Expires',
  //   minWidth: 20,
  //   enableHiding: true,
  //   cell: ({ row, isSelected, width }) => {
  //     let color = isSelected ? 'cyan' : 'gray';
  //     const decodedBody = row.request.body
  //       ? tryDecodeBase64(row.request.body)
  //       : null;
  //     let expiredText = '-';

  //     try {
  //       const knownHeaderNames = ['svix-timestamp', 'stripe-signature'];
  //       const knownBodyNames = ['expired', 'expires'];

  //       // First check headers
  //       for (const name of knownHeaderNames) {
  //         const value = row.request.headers[name];
  //         if (value && typeof value === 'string') {
  //           let timestamp: number | null = null;

  //           if (name === 'stripe-signature') {
  //             const match = value?.match(/t=(\d+)/);
  //             if (match?.[1]) {
  //               timestamp = Number.parseInt(match[1], 10);
  //             }
  //           } else {
  //             timestamp = Number.parseInt(value, 10);
  //           }

  //           if (!Number.isNaN(timestamp) && timestamp !== null) {
  //             const expirationDate = new Date(timestamp * 1000);
  //             const now = new Date();
  //             color =
  //               expirationDate > now ? (isSelected ? 'cyan' : 'green') : 'gray';
  //             expiredText = formatDistanceToNow(expirationDate, {
  //               addSuffix: true,
  //               includeSeconds: true,
  //             });
  //           }
  //           break;
  //         }
  //       }

  //       // If not found in headers, check body
  //       if (expiredText === '-' && decodedBody) {
  //         const parsedBody = JSON.parse(decodedBody);
  //         for (const name of knownBodyNames) {
  //           const value = getNestedField(parsedBody, name);
  //           if (typeof value === 'string') {
  //             expiredText = value;
  //             break;
  //           }
  //         }
  //       }
  //     } catch {
  //       // Do nothing
  //     }
  //     color = isSelected && color === 'gray' ? 'cyan' : color;
  //     return (
  //       <Text
  //         color={color}
  //         dimColor={!isSelected && color === 'gray'}
  //         bold={isSelected}
  //       >
  //         {truncateText(expiredText, width)}
  //       </Text>
  //     );
  //   },
  // },

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
    header: 'Time (ms)',
    minWidth: 8,
    cell: ({ row, isSelected, width }) => {
      let color = isSelected ? 'cyan' : 'white';
      const responseTimeMs = row.responseTimeMs;

      if (responseTimeMs < 1000) {
        color = 'green';
      } else if (responseTimeMs < 3000) {
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
            : truncateText(responseTimeMs.toString(), width)}
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
];
