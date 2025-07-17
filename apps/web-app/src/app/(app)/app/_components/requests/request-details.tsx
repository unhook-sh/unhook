'use client';

import type { RequestType } from '@unhook/db/schema';
import { Button } from '@unhook/ui/components/button';
import { ScrollArea } from '@unhook/ui/components/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@unhook/ui/components/tabs';
import { cn } from '@unhook/ui/lib/utils';
import { ChevronDown, ChevronUp, Copy, X } from 'lucide-react';
import { useState } from 'react';

interface LogDetailsProps {
  request: RequestType;
  onClose: () => void;
}

export function RequestDetails({ request, onClose }: LogDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [_copied, setCopied] = useState(false);

  const handleCopy = (data: RequestType) => {
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
          <Button
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => setIsExpanded(!isExpanded)}
            size="sm"
            variant="ghost"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => handleCopy(request)}
            size="sm"
            variant="ghost"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
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
              {JSON.stringify(request.request, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent className="m-0 p-4" value="response">
            <pre className="font-mono text-xs text-zinc-300">
              {JSON.stringify(request.response, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent className="m-0 p-4" value="headers">
            <pre className="font-mono text-xs text-zinc-300">
              {JSON.stringify(request.request.headers, null, 2)}
            </pre>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
