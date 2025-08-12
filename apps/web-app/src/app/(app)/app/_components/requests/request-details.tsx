'use client';

import { MetricButton } from '@unhook/analytics/components';
import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { cn } from '@unhook/ui/lib/utils';
import { ScrollArea } from '@unhook/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { ChevronDown, ChevronUp, Copy, X } from 'lucide-react';
import { useState } from 'react';

interface LogDetailsProps {
  request: RequestTypeWithEventType;
  onClose: () => void;
}

export function RequestDetails({ request, onClose }: LogDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [_copied, setCopied] = useState(false);

  const handleCopy = (data: RequestTypeWithEventType) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'border-t bg-black text-white transition-all duration-200',
        isExpanded ? 'h-[60%]' : 'h-[300px]',
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Request Details</h3>
          <MetricButton
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
            metric="request_details_expand_clicked"
            onClick={() => setIsExpanded(!isExpanded)}
            size="sm"
            variant="ghost"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </MetricButton>
        </div>
        <div className="flex items-center gap-2">
          <MetricButton
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
            metric="request_details_copy_clicked"
            onClick={() => handleCopy(request)}
            size="sm"
            variant="ghost"
          >
            <Copy className="h-4 w-4" />
          </MetricButton>
          <MetricButton
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
            metric="request_details_close_clicked"
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </MetricButton>
        </div>
      </div>

      <Tabs className="h-[calc(100%-40px)]" defaultValue="request">
        <div className="border-b border-zinc-800 px-4">
          <TabsList className="h-9 bg-black">
            <TabsTrigger
              className="h-8 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              value="request"
            >
              Request
            </TabsTrigger>
            <TabsTrigger
              className="h-8 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              value="response"
            >
              Response
            </TabsTrigger>
            <TabsTrigger
              className="h-8 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              value="headers"
            >
              Headers
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="h-[calc(100%-40px)]">
          <TabsContent className="m-0 p-4" value="request">
            <pre className="font-mono text-xs text-zinc-300">
              {JSON.stringify(request.event?.originRequest, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent className="m-0 p-4" value="response">
            <pre className="font-mono text-xs text-zinc-300">
              {JSON.stringify(request.response, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent className="m-0 p-4" value="headers">
            <pre className="font-mono text-xs text-zinc-300">
              {JSON.stringify(request.event?.originRequest?.headers, null, 2)}
            </pre>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
