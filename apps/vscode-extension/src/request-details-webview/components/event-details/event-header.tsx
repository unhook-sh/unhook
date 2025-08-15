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
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Copy,
  Loader2,
  XCircle,
} from 'lucide-react';
import { vscode } from '../../lib/vscode';
import { useEvent } from './event-context';
import { SourceTooltip } from './source-tooltip';

interface EventHeaderProps {
  onShowAiPrompt: () => void;
}

export function EventHeader({ onShowAiPrompt }: EventHeaderProps) {
  const { event, eventName, source, timestamp } = useEvent();

  const latestRequest = (event.requests || [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.timestamp || b.createdAt || 0).getTime() -
        new Date(a.timestamp || a.createdAt || 0).getTime(),
    )[0];

  const renderStatusIcon = () => {
    // Prefer request-level status when available
    if (latestRequest) {
      if (latestRequest.status === 'pending')
        return <Circle className="size-6 text-primary-foreground/50" />;
      if (latestRequest.status === 'failed')
        return <XCircle className="size-6 fill-red-500 text-black" />;
      if (latestRequest.status === 'completed') {
        const statusCode = latestRequest.response?.status;
        if (
          typeof statusCode === 'number' &&
          statusCode >= 200 &&
          statusCode < 300
        )
          return <CheckCircle2 className="size-6 fill-green-500 text-black" />;
        if (
          typeof statusCode === 'number' &&
          statusCode >= 400 &&
          statusCode < 600
        )
          return <XCircle className="size-6 fill-red-500 text-black" />;
        return <CheckCircle2 className="size-6 fill-green-500 text-black" />;
      }
    }

    // Fallback to event status
    switch (event.status) {
      case 'pending':
        return <Circle className="size-6 text-primary-foreground/50" />;
      case 'processing':
        return (
          <Loader2 className="size-6 animate-spin text-primary-foreground/50" />
        );
      case 'failed':
        return <XCircle className="size-6 fill-red-500 text-black" />;
      case 'completed':
        return <CheckCircle2 className="size-6 fill-green-500 text-black" />;
      default:
        return null;
    }
  };

  const replayEvent = () => {
    vscode.postMessage({
      type: 'replayEventFromEvent',
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here if desired
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const copyEventAsCurl = () => {
    if (!event.originRequest) return;

    const method = event.originRequest.method || 'POST';
    const url = event.originRequest.sourceUrl || '';
    const headers = event.originRequest.headers || {};
    const body = extractBody(event.originRequest.body) || '';

    let curl = `curl -X ${method} '${url}'`;

    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
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

  const copyEventAsFetch = () => {
    if (!event.originRequest) return;

    const method = event.originRequest.method || 'POST';
    const url = event.originRequest.sourceUrl || '';
    const headers = event.originRequest.headers || {};
    const body = extractBody(event.originRequest.body) || '';

    let fetchCode = `fetch('${url}', {\n  method: '${method}'`;

    if (Object.keys(headers).length > 0) {
      fetchCode += `,\n  headers: ${JSON.stringify(headers, null, 2)}`;
    }

    if (body && method !== 'GET') {
      fetchCode += `,\n  body: '${body}'`;
    }

    fetchCode += '\n});';

    copyToClipboard(fetchCode);
  };

  const copyEventAsFetchNode = () => {
    if (!event.originRequest) return;

    const method = event.originRequest.method || 'POST';
    const url = event.originRequest.sourceUrl || '';
    const headers = event.originRequest.headers || {};
    const body = extractBody(event.originRequest.body) || '';

    let fetchCode = `const response = await fetch('${url}', {\n  method: '${method}'`;

    if (Object.keys(headers).length > 0) {
      fetchCode += `,\n  headers: ${JSON.stringify(headers, null, 2)}`;
    }

    if (body && method !== 'GET') {
      fetchCode += `,\n  body: '${body}'`;
    }

    fetchCode += '\n});';

    copyToClipboard(fetchCode);
  };

  const copyEventAsPowerShell = () => {
    if (!event.originRequest) return;

    const method = event.originRequest.method || 'POST';
    const url = event.originRequest.sourceUrl || '';
    const headers = event.originRequest.headers || {};
    const body = extractBody(event.originRequest.body) || '';

    let ps = `Invoke-RestMethod -Uri '${url}' -Method ${method}`;

    // Add headers
    if (Object.keys(headers).length > 0) {
      const headerString = Object.entries(headers)
        .map(([key, value]) => `'${key}' = '${value}'`)
        .join(', ');
      ps += ` -Headers @{${headerString}}`;
    }

    // Add body if present
    if (body && method !== 'GET') {
      ps += ` -Body '${body}'`;
    }

    copyToClipboard(ps);
  };

  const copyPayload = () => {
    if (event.originRequest?.body) {
      const extractedBody = extractBody(event.originRequest.body);
      copyToClipboard(extractedBody || '');
    }
  };

  const copyHeaders = () => {
    if (event.originRequest?.headers) {
      const headerString = Object.entries(event.originRequest.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      copyToClipboard(headerString);
    }
  };

  const copyUrl = () => {
    if (event.originRequest?.sourceUrl) {
      copyToClipboard(event.originRequest.sourceUrl);
    }
  };

  const copyEventName = () => {
    if (event.originRequest?.body) {
      const extractedEventName = extractEventName(event.originRequest.body);
      if (extractedEventName) {
        copyToClipboard(extractedEventName);
      }
    }
  };

  const copyEventId = () => {
    if (event.id) {
      copyToClipboard(event.id);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center">{renderStatusIcon()}</span>
        <div className="text-lg font-medium text-foreground">{eventName}</div>
        <SourceTooltip
          source={source}
          sourceUrl={event.originRequest?.sourceUrl}
        >
          <Badge className="bg-primary text-primary-foreground px-3 py-1 cursor-pointer">
            {getSourceDisplayTextFromString(
              source,
              event.originRequest?.sourceUrl,
            )}
          </Badge>
        </SourceTooltip>
        <TimezoneDisplay date={timestamp} showRelative={true} />
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
            {/* Individual Copy Options */}
            <DropdownMenuItem onClick={copyEventAsCurl}>
              Copy as cURL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyEventAsPowerShell}>
              Copy as PowerShell
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyEventAsFetch}>
              Copy as fetch
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyEventAsFetchNode}>
              Copy as fetch (Node.js)
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Response Copy Options */}
            <DropdownMenuItem onClick={copyUrl}>Copy URL</DropdownMenuItem>
            <DropdownMenuItem onClick={copyPayload}>
              Copy payload
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyHeaders}>
              Copy headers
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyEventName}>
              Copy event name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyEventId}>
              Copy event ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          className="gap-2 bg-transparent"
          onClick={onShowAiPrompt}
          variant="outline"
        >
          <Icons.Sparkles className="size-4" />
          Debug with AI
        </Button>
        <Button className="gap-2" onClick={replayEvent} size="sm">
          <Icons.ArrowUpDown className="size-4" />
          Replay Event
        </Button>
      </div>
    </div>
  );
}
