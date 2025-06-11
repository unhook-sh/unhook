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
    maxWidth: 3, // Status icon doesn't need to grow
    priority: 1, // Always show status
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });

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
    minWidth: 10,
    maxWidth: 25, // Reasonable max for time display
    priority: 2, // Show early
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
    id: 'expired',
    header: 'Expires',
    minWidth: 10,
    maxWidth: 25, // Reasonable max for time display
    priority: 5, // Less important, hide on smaller screens
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
    maxWidth: 10, // HTTP methods are short
    priority: 6, // Can be hidden on very small screens
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(row.originRequest?.method ?? '', width)}
        </Text>
      );
    },
  },
  {
    id: 'source',
    header: 'Source',
    minWidth: 10,
    maxWidth: 40, // Allow source to grow but not too much
    priority: 4, // Important but can be hidden if needed
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(row.source, width)}
        </Text>
      );
    },
  },
  {
    id: 'delivered',
    header: 'Delivered',
    minWidth: 8,
    maxWidth: 12, // Numbers don't need much space
    priority: 7, // Can be hidden on smaller screens
    cell: ({ row, isSelected }) => {
      const color = getSelectedColor({ isSelected });

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
    minWidth: 15,
    priority: 3, // Important to show event name
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor({ isSelected });
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
