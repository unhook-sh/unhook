'use client';

import { extractBody } from '@unhook/client/utils/extract-body';
import type { RequestType } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { Icons } from '@unhook/ui/custom/icons';
import { vscode } from '../../lib/vscode';
import { useEvent } from './event-context';

interface DeliveriesTabProps {
  requests: RequestType[];
}

export function DeliveriesTab({ requests }: DeliveriesTabProps) {
  const { source, timestamp, isRetry, retryAttempt } = useEvent();

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icons.Circle className="size-12 mx-auto mb-4 opacity-50" />
        <p>No forwarded requests found for this event</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg border max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
          <span className="text-sm font-medium text-foreground">
            Delivery Attempts
          </span>
          <Button
            className="gap-2"
            onClick={() => {
              // Send message to request refresh from extension
              vscode.postMessage({
                type: 'refreshEventData',
              });
            }}
            size="sm"
            variant="outline"
          >
            <Icons.ArrowUpDown className="size-4" />
            Refresh
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium text-foreground">
                  Status
                </th>
                <th className="text-left p-2 font-medium text-foreground">
                  Response Time
                </th>
                <th className="text-left p-2 font-medium text-foreground">
                  Destination
                </th>
                <th className="text-left p-2 font-medium text-foreground">
                  Response
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => (
                <tr
                  className={`border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${
                    index % 2 === 0
                      ? 'bg-[var(--vscode-textBlockQuote-background)]'
                      : 'bg-[var(--vscode-textBlockQuote-background)]/5'
                  }`}
                  key={request.id}
                  onClick={() => {
                    // Send message to open request details
                    vscode.postMessage({
                      data: {
                        event: {
                          isRetry,
                          requests: requests.map((req) => ({
                            createdAt: req.createdAt,
                            destinationUrl: req.destinationUrl,
                            failedReason: req.failedReason,
                            id: req.id,
                            response: req.response,
                            responseTimeMs: req.responseTimeMs,
                            status: req.status,
                            timestamp: req.timestamp,
                          })),
                          retryAttempt,
                          source,
                          timestamp,
                        },
                        request: {
                          createdAt: request.createdAt,
                          destinationUrl: request.destinationUrl,
                          failedReason: request.failedReason,
                          id: request.id,
                          response: request.response,
                          responseTimeMs: request.responseTimeMs,
                          status: request.status,
                          timestamp: request.timestamp,
                        },
                      },
                      type: 'openRequestDetails',
                    });
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`font-mono ${
                          (request.response?.status ?? 0) >= 200 &&
                          (request.response?.status ?? 0) < 300
                            ? 'text-white bg-green-500 border-green-600'
                            : (request.response?.status ?? 0) >= 400
                              ? 'text-white bg-red-500 border-red-600'
                              : 'text-white bg-yellow-500 border-yellow-600'
                        }`}
                      >
                        {request.response?.status ||
                          (request.status === 'completed'
                            ? '200'
                            : request.status === 'failed'
                              ? '500'
                              : '202')}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-mono ${request.responseTimeMs > 2000 ? 'text-warning font-medium' : 'text-muted-foreground'}`}
                      >
                        {request.responseTimeMs}ms
                      </span>
                      {request.responseTimeMs > 2000 && (
                        <Icons.AlertTriangle className="size-4 text-warning" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm text-foreground break-all max-w-64">
                      {request.destinationUrl}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-80">
                      <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                        {(() => {
                          if (request.response?.body) {
                            const extractedResponseBody = extractBody(
                              request.response.body,
                            );
                            return (
                              extractedResponseBody || request.response.body
                            );
                          }
                          return JSON.stringify(request.response, null, 2);
                        })()}
                      </pre>
                    </div>
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
