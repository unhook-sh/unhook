import type { EventTypeWithRequest } from '@unhook/db/schema';
import { differenceInMinutes, format } from 'date-fns';
import figureSet from 'figures';
import { Text } from 'ink';
import { Spinner } from '~/components/spinner';
import {
  getSelectedColor,
  truncateText,
} from '~/components/table/column-utils';
import type { ColumnDef } from '~/components/table/types';
import { extractEventName } from '~/utils/extract-event-name';
import { formatRelativeTime } from '~/utils/format-relative-time';

// Service configuration for webhook verification windows
const serviceConfig = {
  stripe: {
    verificationWindowMs: 300 * 1000, // 300 seconds
    userAgentPattern: /^Stripe\//i,
  },
  clerk: {
    verificationWindowMs: 300 * 1000, // 300 seconds
    userAgentPattern: /^Clerk\//i,
  },
  svix: {
    verificationWindowMs: 300 * 1000, // 300 seconds
    userAgentPattern: /^Svix-Webhooks\//i,
  },
  slack: {
    verificationWindowMs: 600 * 1000, // 600 seconds
    userAgentPattern: /^Slack\//i,
  },
  unhook: {
    verificationWindowMs: 300 * 1000, // 300 seconds
    userAgentPattern: /^Unhook.*/i,
  },
};

export const columns: ColumnDef<EventTypeWithRequest>[] = [
  {
    id: 'status',
    header: '',
    minWidth: 3,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor(isSelected);

      if (row.status === 'pending') {
        return <Spinner dimColor={!isSelected} bold={isSelected} />;
      }
      const lastResponse = row.requests?.[0]?.response;

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
    id: 'expired',
    header: 'Expires',
    minWidth: 20,
    cell: ({ row, isSelected, width }) => {
      let color = getSelectedColor(isSelected);
      let expiredText = '-';

      try {
        const userAgent = row.originRequest?.headers['user-agent'] || '';
        // Use webhook timestamp if available, otherwise fall back to createdAt
        const requestTime = new Date(row.timestamp || row.createdAt);
        const now = new Date();

        // Find matching service from user agent
        const service = Object.entries(serviceConfig).find(([_, config]) =>
          config.userAgentPattern.test(userAgent),
        );

        if (service) {
          const [_serviceName, config] = service;
          const expirationDate = new Date(
            requestTime.getTime() + config.verificationWindowMs,
          );

          color = expirationDate > now ? 'green' : 'red';

          if (Math.abs(differenceInMinutes(expirationDate, now)) < 60) {
            // Less than an hour - use relative time
            expiredText = formatRelativeTime(expirationDate);
          } else {
            // More than an hour - use standard format
            expiredText = format(expirationDate, 'MMM d, HH:mm:ss');
          }
        }
      } catch {
        // Do nothing
      }

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(expiredText, width)}
        </Text>
      );
    },
  },
  {
    id: 'method',
    header: 'Method',
    minWidth: 4,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor(isSelected);
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(row.originRequest?.method ?? '', width)}
        </Text>
      );
    },
  },
  {
    id: 'from',
    header: 'From',
    minWidth: 25,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor(isSelected);
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(row.from, width)}
        </Text>
      );
    },
  },
  {
    id: 'requests',
    header: 'Forwarded Requests',
    minWidth: 25,
    cell: ({ row, isSelected }) => {
      const color = getSelectedColor(isSelected);

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {row.requests?.length ?? 0}
        </Text>
      );
    },
  },
  {
    id: 'event',
    header: 'Event',
    minWidth: 35,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor(isSelected);
      const originRequest = row.originRequest;
      const eventName = extractEventName(originRequest?.body);

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(eventName ?? '', width)}
        </Text>
      );
    },
  },
];
