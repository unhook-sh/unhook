'use client';

import { extractBody } from '@unhook/client/utils/extract-body';
import { extractEventName } from '@unhook/client/utils/extract-event-name';
import { getSourceDisplayTextFromString } from '@unhook/client/utils/source-display';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { Icons } from '@unhook/ui/custom/icons';
import { TimezoneDisplay } from '@unhook/ui/custom/timezone-display';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@unhook/ui/dropdown-menu';
import { ArrowLeft, ChevronDown, Copy } from 'lucide-react';
import { useState } from 'react';
import { vscode } from '../../lib/vscode';
import { AiPromptDialog } from '../shared/ai-prompt-dialog';
import { useRequest } from './request-context';
import { SourceTooltip } from './source-tooltip';

export function RequestHeader() {
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  const {
    request,
    event,
    source,
    timestamp,
    responseTime,
    isCompleted,
    isPending,
  } = useRequest();

  const destinationUrl = request.destinationUrl;

  // Extract event name from the original request body
  const eventName = event?.originRequest?.body
    ? extractEventName(event.originRequest.body) || 'Unknown event'
    : 'Unknown event';

  const goBackToEvent = () => {
    if (event) {
      vscode.postMessage({
        data: {
          event: event,
        },
        type: 'openRequestDetails',
      });
    }
  };

  const replayRequest = () => {
    vscode.postMessage({
      data: {
        request: request,
      },
      type: 'replayRequest',
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const copyRequestAsCurl = () => {
    if (!event?.originRequest) return;

    const method = event.originRequest.method || 'POST';
    const url = destinationUrl || '';
    const requestHeaders = event.originRequest.headers || {};
    const body = extractBody(event.originRequest.body) || '';

    let curl = `curl -X ${method} '${url}'`;

    // Add headers
    Object.entries(requestHeaders).forEach(([key, value]) => {
      if (value) {
        curl += ` -H '${key}: ${value}'`;
      }
    });

    // Add body if present
    if (body && method !== 'GET') {
      curl += ` -d '${body}'`;
    }

    copyToClipboard(curl);
  };

  const copyRequestAsFetch = () => {
    if (!event?.originRequest) return;

    const method = event.originRequest.method || 'POST';
    const url = destinationUrl || '';
    const requestHeaders = event.originRequest.headers || {};
    const body = extractBody(event.originRequest.body) || '';

    let fetchCode = `fetch('${url}', {\n  method: '${method}'`;

    if (Object.keys(requestHeaders).length > 0) {
      fetchCode += `,\n  headers: ${JSON.stringify(requestHeaders, null, 2)}`;
    }

    if (body && method !== 'GET') {
      fetchCode += `,\n  body: '${body}'`;
    }

    fetchCode += '\n});';

    copyToClipboard(fetchCode);
  };

  const copyDestinationUrl = () => {
    if (destinationUrl) {
      copyToClipboard(destinationUrl);
    }
  };

  const copyResponseBody = () => {
    if (request.response?.body) {
      const extractedBody = extractBody(request.response.body);
      copyToClipboard(extractedBody || '');
    }
  };

  const copyRequestId = () => {
    if (request.id) {
      copyToClipboard(request.id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            disabled={!event}
            onClick={goBackToEvent}
            size="sm"
            variant="outline"
          >
            <ArrowLeft className="size-4" />
          </Button>

          {isCompleted && request.response?.status ? (
            <Badge
              className={`font-mono ${
                (request.response.status ?? 0) >= 200 &&
                (request.response.status ?? 0) < 300
                  ? 'text-white bg-green-500 border-green-600'
                  : (request.response.status ?? 0) >= 400
                    ? 'text-white bg-red-500 border-red-600'
                    : 'text-white bg-yellow-500 border-yellow-600'
              }`}
            >
              {request.response.status}
            </Badge>
          ) : (
            <Badge className="text-white bg-muted-foreground border-muted-foreground">
              {isPending ? '...' : 'N/A'}
            </Badge>
          )}

          <div className="text-lg font-medium text-foreground">{eventName}</div>

          <SourceTooltip
            source={source}
            sourceUrl={event?.originRequest?.sourceUrl}
          >
            <Badge className="bg-primary text-primary-foreground px-3 py-1 cursor-pointer">
              {getSourceDisplayTextFromString(
                source,
                event?.originRequest?.sourceUrl,
              )}
            </Badge>
          </SourceTooltip>

          <span className="text-sm text-muted-foreground">
            <TimezoneDisplay date={timestamp} showRelative={true} />
          </span>

          {responseTime > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span
                className={
                  responseTime > 2000
                    ? 'text-warning font-medium'
                    : 'text-muted-foreground'
                }
              >
                {responseTime}ms
              </span>
              {responseTime > 2000 && (
                <Icons.AlertTriangle className="size-4 text-warning" />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2" variant="outline">
                <Copy className="size-4" />
                Copy
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Request Copy Options */}
              <DropdownMenuItem onClick={copyRequestAsCurl}>
                Copy as cURL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyRequestAsFetch}>
                Copy as fetch
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Individual Copy Options */}
              <DropdownMenuItem onClick={copyDestinationUrl}>
                Copy destination URL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyResponseBody}>
                Copy response body
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyRequestId}>
                Copy request ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            className="gap-2 bg-transparent"
            onClick={() => setShowAiPrompt(true)}
            variant="outline"
          >
            <Icons.Sparkles className="size-4" />
            Debug with AI
          </Button>

          <Button
            className="gap-2"
            onClick={replayRequest}
            size="sm"
            variant="default"
          >
            <Icons.ArrowUpDown className="size-4" />
            Replay Request
          </Button>
        </div>
      </div>

      {/* Destination URL on its own line */}
      {destinationUrl && (
        <div className="mt-3">
          <span className="font-mono text-foreground text-sm break-all">
            {destinationUrl}
          </span>
        </div>
      )}

      {/* AI Prompt Dialog */}
      <AiPromptDialog
        data={request}
        mode="request"
        onOpenChange={setShowAiPrompt}
        open={showAiPrompt}
      />
    </>
  );
}
