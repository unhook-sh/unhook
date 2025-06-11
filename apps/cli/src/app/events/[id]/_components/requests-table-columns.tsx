import type { RequestType } from '@unhook/db/schema';
import figureSet from 'figures';
import { Text } from 'ink';
import { Spinner } from '~/components/spinner';
import {
  getSelectedColor,
  truncateText,
} from '~/components/table/column-utils';
import type { ColumnDef } from '~/components/table/types';
import { formatRelativeTime } from '~/utils/format-relative-time';

export const columns: ColumnDef<RequestType>[] = [
  {
    id: 'status',
    header: '',
    minWidth: 3,
    maxWidth: 3,
    priority: 1,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });

      if (row.status === 'pending') {
        return <Spinner dimColor={!isSelected} bold={isSelected} />;
      }
      const lastResponse = row.response;

      if (
        row.status === 'completed' &&
        lastResponse &&
        lastResponse.status >= 200 &&
        lastResponse.status < 300
      ) {
        return (
          <Text color="green" dimColor={!isSelected} bold={isSelected}>
            {figureSet.circleFilled}
          </Text>
        );
      }

      if (
        lastResponse &&
        lastResponse.status >= 400 &&
        lastResponse.status < 500
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
          lastResponse &&
          (lastResponse.status < 200 || lastResponse.status >= 300))
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
    header: 'Delivered',
    minWidth: 10,
    maxWidth: 25,
    priority: 2,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });
      const timeText = formatRelativeTime(row.createdAt);

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(timeText, width)}
        </Text>
      );
    },
  },
  {
    id: 'destination',
    header: 'Destination',
    minWidth: 10,
    maxWidth: 30,
    priority: 3,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(row.destination?.name, width)}
        </Text>
      );
    },
  },

  {
    id: 'responseCode',
    header: 'Code',
    minWidth: 4,
    maxWidth: 6,
    priority: 4,
    cell: ({ row, isSelected, width }) => {
      let color = 'green';
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
    id: 'elapsedMs',
    header: 'Elapsed (ms)',
    minWidth: 8,
    maxWidth: 15,
    priority: 5,
    cell: ({ row, isSelected, width }) => {
      let color = getSelectedColor({ isSelected, defaultColor: 'green' });
      const responseTimeMs = row.responseTimeMs ?? 0;

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
    id: 'url',
    header: 'URL',
    minWidth: 20,
    priority: 6,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });

      let url = row.destination?.url;
      if (url) {
        url = new URL(url).toString();
      }

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(url, width)}
        </Text>
      );
    },
  },
];
