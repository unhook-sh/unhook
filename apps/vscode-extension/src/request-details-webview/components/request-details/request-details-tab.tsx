'use client';

import { TimezoneDisplay } from '@unhook/ui/custom/timezone-display';
import { useRequest } from './request-context';

export function RequestDetailsTab() {
  const { request, event } = useRequest();

  // Extract the fields we want to display
  const requestDetails = [
    { key: 'Destination', value: request.destinationName },
    { key: 'Destination URL', value: request.destinationUrl },
    { key: 'Source', value: request.source },
    { key: 'Status', value: request.status },
    { key: 'Response Time', value: `${request.responseTimeMs}ms` },

    {
      key: 'Sent At',
      value: <TimezoneDisplay date={request.timestamp} showRelative={true} />,
    },
    {
      key: 'Created At',
      value: <TimezoneDisplay date={request.createdAt} showRelative={true} />,
    },
    ...(request.completedAt
      ? [
          {
            key: 'Completed At',
            value: (
              <TimezoneDisplay date={request.completedAt} showRelative={true} />
            ),
          },
        ]
      : []),
    ...(request.failedReason
      ? [
          {
            key: 'Failure Reason',
            value: request.failedReason,
          },
        ]
      : []),
    ...(event
      ? [
          {
            key: 'Event Status',
            value: event.status,
          },
        ]
      : []),
    ...(event?.originRequest
      ? [
          {
            key: 'Original Method',
            value: event.originRequest.method,
          },
        ]
      : []),
    ...(event?.originRequest
      ? [
          {
            key: 'Original Source URL',
            value: event.originRequest.sourceUrl,
          },
        ]
      : []),
    ...(event?.originRequest
      ? [
          {
            key: 'Original Client IP',
            value: event.originRequest.clientIp,
          },
        ]
      : []),
    ...(event?.originRequest
      ? [
          {
            key: 'Original Content Type',
            value: event.originRequest.contentType,
          },
        ]
      : []),
    ...(event?.originRequest
      ? [
          {
            key: 'Original Size',
            value: `${event.originRequest.size} bytes`,
          },
        ]
      : []),
    { key: 'Request ID', value: request.id },
    { key: 'Event ID', value: request.eventId || 'N/A' },
    { key: 'Webhook ID', value: request.webhookId },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg border max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
          <span className="text-sm font-medium text-foreground">
            Request Details
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium text-foreground sr-only">
                  Field
                </th>
                <th className="text-left p-2 font-medium text-foreground sr-only">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {requestDetails.map(({ key, value }, index) => (
                <tr
                  className={`border-b border-border/50 ${
                    index % 2 === 0
                      ? 'bg-[var(--vscode-textBlockQuote-background)]'
                      : 'bg-[var(--vscode-textBlockQuote-background)]/5'
                  }`}
                  key={key}
                >
                  <td className="px-4 py-2 font-mono text-sm font-medium text-foreground whitespace-nowrap w-32">
                    {key}
                  </td>
                  <td className="px-4 py-2 font-mono text-sm text-foreground break-all pl-2">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
