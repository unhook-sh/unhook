'use client';

import { MetricButton } from '@unhook/analytics/components';
import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { cn } from '@unhook/ui/lib/utils';
import { ScrollArea } from '@unhook/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unhook/ui/tooltip';
import { ArrowDown, ArrowUp, Copy, Shield, X } from 'lucide-react';
import { useState } from 'react';

interface LogMetadataProps {
  request: RequestTypeWithEventType;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function RequestMetadata({
  request,
  onClose,
  onNavigate,
  hasPrev = true,
  hasNext = true,
}: LogMetadataProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTimestamp = () => {
    const date = new Date();
    const month = date
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase();
    const day = date.getDate().toString().padStart(2, '0');
    return `${month} ${day} ${request.createdAt.toLocaleString()} GMT-7`;
  };

  return (
    <div className="flex h-full flex-col bg-black text-white">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge
            className="bg-black text-white border-zinc-700 font-mono"
            variant="outline"
          >
            {request.event?.originRequest?.method}
          </Badge>
          <span className="font-mono">{request.destination.name}</span>
          <Badge
            className={cn(
              'font-mono',
              (request.response?.status ?? 0) < 400 &&
                'bg-green-950 text-green-500 border-green-800',
            )}
            variant={
              (request.response?.status ?? 0) >= 400 ? 'destructive' : 'outline'
            }
          >
            {(request.response?.status ?? 0).toString()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <MetricButton
            className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            disabled={!hasPrev}
            metric="request_metadata_navigate_prev_clicked"
            onClick={() => onNavigate?.('prev')}
            size="icon"
            variant="ghost"
          >
            <ArrowUp className="h-5 w-5" />
          </MetricButton>
          <MetricButton
            className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            disabled={!hasNext}
            metric="request_metadata_navigate_next_clicked"
            onClick={() => onNavigate?.('next')}
            size="icon"
            variant="ghost"
          >
            <ArrowDown className="h-5 w-5" />
          </MetricButton>
          <div className="h-6 w-px bg-zinc-800 mx-1" />
          <MetricButton
            className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            metric="request_metadata_close_clicked"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="h-5 w-5" />
          </MetricButton>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0">
          <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700">
              <div className="h-2 w-2 rounded-full bg-zinc-400" />
            </div>
            <span className="text-zinc-400">Request started</span>
            <span className="ml-auto text-zinc-400 font-mono">
              {formattedTimestamp()}
            </span>
          </div>

          <div className="border-b border-zinc-800 p-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-zinc-400">Request ID</div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm">{request.id}</code>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <MetricButton
                          className="h-6 w-6 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                          metric="request_metadata_copy_id_clicked"
                          onClick={() => handleCopy(request.id)}
                          size="icon"
                          variant="ghost"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </MetricButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {copied ? 'Copied!' : 'Copy ID'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="space-y-1 border-t border-zinc-800 pt-4">
                <div className="text-zinc-400">Path</div>
                <div className="font-mono text-sm">
                  {request.destination.name}
                </div>
              </div>

              <div className="space-y-1 border-t border-zinc-800 pt-4">
                <div className="text-zinc-400">Host</div>
                <div className="font-mono text-sm">
                  {new URL(request.destination.url).host}
                </div>
              </div>

              <div className="space-y-1 border-t border-zinc-800 pt-4">
                <div className="text-zinc-400">User Agent</div>
                <div className="font-mono text-sm break-words">
                  {request.event?.originRequest?.headers?.['user-agent']}
                </div>
              </div>

              <div className="space-y-1 border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-zinc-400">Search Params</div>
                  {Object.keys(request.event?.originRequest?.headers ?? {})
                    .length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <MetricButton
                            className="h-6 w-6 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                            metric="request_metadata_copy_params_clicked"
                            onClick={() =>
                              handleCopy(
                                JSON.stringify(
                                  request.event?.originRequest?.headers,
                                ),
                              )
                            }
                            size="icon"
                            variant="ghost"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </MetricButton>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          {copied ? 'Copied!' : 'Copy params'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {Object.keys(request.event?.originRequest?.headers ?? {})
                  .length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(
                      request.event?.originRequest?.headers ?? {},
                    ).map(([key, value]) => (
                      <div className="flex" key={key}>
                        <Badge
                          className="rounded-r-none bg-black text-white border-zinc-700 font-mono"
                          variant="outline"
                        >
                          {key}
                        </Badge>
                        <Badge
                          className="rounded-l-none bg-zinc-800 text-white border-zinc-700 border-l-0 font-mono"
                          variant="outline"
                        >
                          {value as string}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-zinc-500">No search params</div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline visualization */}
          <div className="relative">
            <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-zinc-800" />

            <div className="relative border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-md border border-zinc-700 bg-black">
                  <Shield className="h-5 w-5 text-zinc-400" />
                </div>
                <span>Firewall</span>
                <Badge
                  className="ml-auto bg-black text-white border-zinc-700"
                  variant="outline"
                >
                  Allowed
                </Badge>
              </div>
            </div>

            <div className="relative border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-md border border-zinc-700 bg-black">
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Middleware</title>
                    <rect
                      height="18"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="18"
                      x="3"
                      y="3"
                    />
                    <path d="M7 12H17" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M12 7L12 17"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <span>Middleware</span>
                <Badge
                  className="ml-auto bg-green-950 text-green-500 border-green-800 font-mono"
                  variant="outline"
                >
                  200
                </Badge>
              </div>
            </div>

            <div className="relative border-b border-zinc-800 px-4 py-3">
              <div className="space-y-1">
                <div className="text-zinc-400">Location</div>
                <div className="text-sm">
                  {request.event?.originRequest?.clientIp}
                </div>
              </div>
            </div>

            <div className="relative border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-md border border-zinc-700 bg-black">
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Webhook</title>
                    <path
                      d="M12 4L4 8L12 12L20 8L12 4Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M4 16L12 20L20 16"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M4 12L12 16L20 12"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <span>Webhook</span>
                <div className="ml-auto flex items-center gap-2">
                  <Badge
                    className="bg-black text-white border-zinc-700"
                    variant="outline"
                  >
                    Delivered to localhost:
                    {request.event?.originRequest?.headers?.port || '3000'}
                  </Badge>
                  <Badge
                    className={
                      (request.response?.status ?? 0) < 400
                        ? 'bg-green-950 text-green-500 border-green-800 font-mono'
                        : 'font-mono'
                    }
                    variant={
                      (request.response?.status ?? 0) >= 400
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {(request.response?.status ?? 0).toString()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="relative px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-md border border-zinc-700 bg-black">
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Client</title>
                    <rect
                      height="18"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="20"
                      x="2"
                      y="3"
                    />
                    <path d="M2 9H22" stroke="currentColor" strokeWidth="2" />
                    <circle cx="6" cy="6" fill="currentColor" r="1" />
                    <circle cx="10" cy="6" fill="currentColor" r="1" />
                  </svg>
                </div>
                <span>Client</span>
                <Badge
                  className={
                    (request.response?.status ?? 0) < 400
                      ? 'bg-green-950 text-green-500 border-green-800 font-mono'
                      : 'font-mono'
                  }
                  variant={
                    (request.response?.status ?? 0) >= 400
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  {request.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
