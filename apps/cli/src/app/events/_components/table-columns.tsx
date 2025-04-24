import { debug } from '@unhook/logger';
import { differenceInMinutes, format, formatDistanceToNow } from 'date-fns';
import figureSet from 'figures';
import { Text } from 'ink';
import { Spinner } from '~/components/spinner';
import type { ColumnDef } from '~/components/table/types';
import type { EventWithRequest } from '~/stores/events-store';

const log = debug('unhook:cli:events:table-columns');

function getSelectedColor(isSelected: boolean, defaultColor = 'gray'): string {
  return isSelected ? 'white' : defaultColor;
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

const knownEventTypeNames = ['event', 'type', 'event_type', 'eventType'];
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

export const columns: ColumnDef<EventWithRequest>[] = [
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
      const now = new Date();
      const requestTime = new Date(row.createdAt);
      let timeText: string;

      const diffInMinutes = differenceInMinutes(now, requestTime);

      if (Math.abs(diffInMinutes) < 60) {
        // Less than an hour - show minutes/seconds
        const diffInSeconds = Math.floor(
          (now.getTime() - requestTime.getTime()) / 1000,
        );

        if (Math.abs(diffInSeconds) < 60) {
          // Less than a minute - show seconds
          timeText = `${Math.abs(diffInSeconds)} seconds ago`;
        } else {
          // Minutes
          timeText = formatDistanceToNow(requestTime, {
            includeSeconds: false,
          });
          // Remove the "about" prefix if it exists
          timeText = timeText.replace('about ', '');
          timeText = `${timeText} ago`;
        }
      } else {
        // More than an hour - use standard format
        timeText = format(requestTime, 'MMM d, HH:mm:ss');
      }

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

          const diffInMinutes = differenceInMinutes(expirationDate, now);
          const isInFuture = expirationDate > now;

          if (Math.abs(diffInMinutes) < 60) {
            // Less than an hour - show minutes/seconds
            const diffInSeconds = Math.floor(
              (expirationDate.getTime() - now.getTime()) / 1000,
            );

            if (Math.abs(diffInSeconds) < 60) {
              // Less than a minute - show seconds
              expiredText = `${Math.abs(diffInSeconds)} seconds`;
            } else {
              // Minutes
              expiredText = formatDistanceToNow(expirationDate, {
                includeSeconds: false,
              });
              // Remove the "about" prefix if it exists
              expiredText = expiredText.replace('about ', '');
            }
            // Add the appropriate suffix
            expiredText = isInFuture
              ? `in ${expiredText}`
              : `${expiredText} ago`;
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
    id: 'to',
    header: 'To',
    minWidth: 25,
    cell: ({ row, isSelected, width }) => {
      const color = getSelectedColor(isSelected);
      const lastRequest = row.requests?.[0];

      let to = lastRequest?.to;
      if (to && to !== '*') {
        to = new URL(to).pathname;
      }

      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(to ?? '', width)}
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
      const responseCode = row.requests?.[0]?.response?.status;

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
    header: 'Elapsed',
    minWidth: 8,
    cell: ({ row, isSelected, width }) => {
      let color = getSelectedColor(isSelected, 'green');
      const responseTimeMs = row.requests?.[0]?.responseTimeMs ?? 0;

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
      const color = getSelectedColor(isSelected);
      const lastRequest = row.requests?.[0];
      log('last request', lastRequest);
      const decodedBody = lastRequest?.request.body
        ? tryDecodeBase64(lastRequest.request.body)
        : null;
      let event = null;
      try {
        log('parsedBody', decodedBody);
        const parsedBody = decodedBody ? JSON.parse(decodedBody) : null;
        for (const name of knownEventTypeNames) {
          const value = getNestedField(parsedBody, name);
          if (typeof value === 'string') {
            event = value;
            break;
          }
        }
      } catch (error) {
        log('Error rendering event table column', error);
        // Do nothing
      }
      return (
        <Text color={color} dimColor={!isSelected} bold={isSelected}>
          {truncateText(event ?? '', width)}
        </Text>
      );
    },
  },
];
