import { extractEventName } from '@unhook/client/utils/extract-event-name';
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
import { formatRelativeTime } from '~/utils/format-relative-time';

// Service configuration for webhook verification windows
const serviceConfig = {
  clerk: {
    userAgentPattern: /^Clerk\//i, // 300 seconds
    verificationWindowMs: 300 * 1000,
  },
  slack: {
    userAgentPattern: /^Slack\//i, // 600 seconds
    verificationWindowMs: 600 * 1000,
  },
  stripe: {
    userAgentPattern: /^Stripe\//i, // 300 seconds
    verificationWindowMs: 300 * 1000,
  },
  svix: {
    userAgentPattern: /^Svix-Webhooks\//i, // 300 seconds
    verificationWindowMs: 300 * 1000,
  },
  unhook: {
    userAgentPattern: /^Unhook.*/i, // 300 seconds
    verificationWindowMs: 300 * 1000,
  },
};

export const columns: ColumnDef<EventTypeWithRequest>[] = [
  {
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });

      if (row.status === 'pending') {
        return <Spinner bold={isSelected} dimColor={!isSelected} />;
      }
      const lastResponse = row.requests?.[0]?.response;

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
    maxWidth: 3, // Status icon doesn't need to grow
    minWidth: 3, // Always show status
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
    header: 'Created',
    id: 'time',
    maxWidth: 25, // Reasonable max for time display
    minWidth: 10, // Show early
    priority: 2,
  },
  {
    cell: ({ row, isSelected, width }) => {
      let color = getSelectedColor({ isSelected });
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
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {truncateText(expiredText, width)}
        </Text>
      );
    },
    header: 'Expires',
    id: 'expired',
    maxWidth: 25, // Reasonable max for time display
    minWidth: 10, // Less important, hide on smaller screens
    priority: 5,
  },
  {
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });
      return (
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {truncateText(row.originRequest?.method ?? '', width)}
        </Text>
      );
    },
    header: 'Method',
    id: 'method',
    maxWidth: 10, // HTTP methods are short
    minWidth: 4, // Can be hidden on very small screens
    priority: 6,
  },
  {
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });
      return (
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {truncateText(row.source, width)}
        </Text>
      );
    },
    header: 'Source',
    id: 'source',
    maxWidth: 40, // Allow source to grow but not too much
    minWidth: 10, // Important but can be hidden if needed
    priority: 4,
  },
  {
    cell: ({ row, isSelected }) => {
      const color = getSelectedColor({ isSelected });

      return (
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {row.requests?.length ?? 0}
        </Text>
      );
    },
    header: 'Delivered',
    id: 'delivered',
    maxWidth: 12, // Numbers don't need much space
    minWidth: 8, // Can be hidden on smaller screens
    priority: 7,
  },
  {
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });
      const originRequest = row.originRequest;
      const eventName = extractEventName(originRequest?.body);

      return (
        <Text bold={isSelected} color={color} dimColor={!isSelected}>
          {truncateText(eventName ?? '', width)}
        </Text>
      );
    },
    header: 'Event',
    id: 'event',
    minWidth: 15, // Important to show event name
    priority: 3,
  },
];
