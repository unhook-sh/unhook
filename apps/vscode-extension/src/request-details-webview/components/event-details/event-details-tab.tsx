'use client';

import { TimezoneDisplay } from '@unhook/ui/custom/timezone-display';
import { useEvent } from './event-context';

export function EventDetailsTab() {
  const { event } = useEvent();
  const { originRequest, id, status } = event;
  // Extract the fields we want to display (excluding headers and body)
  const requestDetails = [
    { key: 'Method', value: originRequest.method },
    { key: 'Source URL', value: originRequest.sourceUrl },
    { key: 'Source', value: event.source },
    { key: 'Client IP', value: originRequest.clientIp },
    { key: 'Content Type', value: originRequest.contentType },
    { key: 'Size', value: `${originRequest.size} bytes` },
    { key: 'Status', value: status },
    {
      key: 'Timestamp',
      value: <TimezoneDisplay date={event.timestamp} showRelative={true} />,
    },
    { key: 'Event ID', value: id },
    { key: 'Webhook ID', value: event.webhookId },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg border max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
          <span className="text-sm font-medium text-foreground">
            Event Details
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
