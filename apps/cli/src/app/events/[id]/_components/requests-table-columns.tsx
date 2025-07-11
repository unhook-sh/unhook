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
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });

      if (row.status === 'pending') {
        return <Spinner bold={isSelected} dimColor={!isSelected} />;
      }
      const lastResponse = row.response;

      if (
        row.status === 'completed' &&
        lastResponse &&
        lastResponse.status >= 200 &&
        lastResponse.status < 300
      ) {
        return (
          <Text bold={isSelected} color="green" dimColor={!isSelected}>
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
          <Text bold={isSelected} color="yellow" dimColor={!isSelected}>
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
          <Text bold={isSelected} color="red" dimColor={!isSelected}>
            {figureSet.circle}
          </Text>
        );
      }

      return (
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {truncateText(row.status, width)}
        </Text>
      );
    },
    header: '',
    id: 'status',
    maxWidth: 3,
    minWidth: 3,
    priority: 1,
  },
  {
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });
      const timeText = formatRelativeTime(row.createdAt);

      return (
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {truncateText(timeText, width)}
        </Text>
      );
    },
    header: 'Delivered',
    id: 'time',
    maxWidth: 25,
    minWidth: 10,
    priority: 2,
  },
  {
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });

      return (
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {truncateText(row.destination?.name, width)}
        </Text>
      );
    },
    header: 'Destination',
    id: 'destination',
    maxWidth: 30,
    minWidth: 10,
    priority: 3,
  },

  {
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
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {truncateText(String(responseCode || '-'), width)}
        </Text>
      );
    },
    header: 'Code',
    id: 'responseCode',
    maxWidth: 6,
    minWidth: 4,
    priority: 4,
  },
  {
    cell: ({ row, isSelected, width }) => {
      let color = getSelectedColor({ defaultColor: 'green', isSelected });
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
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {responseTimeMs === 0 || responseTimeMs === undefined
            ? '-'
            : truncateText(responseTimeMs.toString(), width)}
        </Text>
      );
    },
    header: 'Elapsed (ms)',
    id: 'elapsedMs',
    maxWidth: 15,
    minWidth: 8,
    priority: 5,
  },

  {
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });

      let url = row.destination?.url;
      if (url) {
        url = new URL(url).toString();
      }

      return (
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {truncateText(url, width)}
        </Text>
      );
    },
    header: 'URL',
    id: 'url',
    minWidth: 20,
    priority: 6,
  },
];
