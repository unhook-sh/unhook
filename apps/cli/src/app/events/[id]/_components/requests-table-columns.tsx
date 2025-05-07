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
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor(isSelected);

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
    header: 'Created',
    minWidth: 20,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor(isSelected);
      const timeText = formatRelativeTime(row.createdAt);

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(timeText, width)}
        </Text>
      );
    },
  },
  {
    id: 'to',
    header: 'To',
    minWidth: 25,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor(isSelected);

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(row.to?.name, width)}
        </Text>
      );
    },
  },

  {
    id: 'responseCode',
    header: 'Code',
    minWidth: 4,
    cell: ({ row, isSelected, width }) => {
      let color = getSelectedColor(isSelected, 'green');
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
    cell: ({ row, isSelected, width }) => {
      let color = getSelectedColor(isSelected, 'green');
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
    minWidth: 25,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor(isSelected);

      let url = row.to?.url;
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
