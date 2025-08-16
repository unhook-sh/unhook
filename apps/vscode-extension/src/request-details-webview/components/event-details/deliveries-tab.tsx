'use client';

import { extractBody } from '@unhook/client/utils/extract-body';
import type { RequestType } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { Icons } from '@unhook/ui/custom/icons';
import { TimezoneDisplay } from '@unhook/ui/custom/timezone-display';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unhook/ui/tooltip';
import { vscode } from '../../lib/vscode';
import { useEvent } from './event-context';

interface DeliveriesTabProps {
  requests: RequestType[];
}

export function DeliveriesTab({ requests }: DeliveriesTabProps) {
  const { event } = useEvent();

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
                  Delivered At
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
                        event: event,
                        request: request,
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
                    <div className="text-sm">
                      <TimezoneDisplay
                        date={request.createdAt}
                        showRelative={true}
                      />
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs font-mono text-foreground cursor-help">
                              {(() => {
                                if (request.response?.body) {
                                  const extractedResponseBody = extractBody(
                                    request.response.body,
                                  );
                                  const fullResponse =
                                    extractedResponseBody ||
                                    request.response.body;
                                  // Truncate to first 100 characters
                                  return fullResponse.length > 100
                                    ? `${fullResponse.substring(0, 100)}...`
                                    : fullResponse;
                                }
                                const fullResponse = JSON.stringify(
                                  request.response,
                                  null,
                                  2,
                                );
                                return fullResponse.length > 100
                                  ? `${fullResponse.substring(0, 100)}...`
                                  : fullResponse;
                              })()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-96 p-3">
                            <div className="text-xs font-mono text-foreground max-h-64 overflow-y-auto">
                              {(() => {
                                if (request.response?.body) {
                                  const extractedResponseBody = extractBody(
                                    request.response.body,
                                  );
                                  return (
                                    extractedResponseBody ||
                                    request.response.body
                                  );
                                }
                                return JSON.stringify(
                                  request.response,
                                  null,
                                  2,
                                );
                              })()}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
