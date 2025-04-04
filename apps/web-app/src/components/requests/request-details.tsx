'use client';

import { ChevronDown, ChevronUp, Copy, X } from 'lucide-react';
import { useState } from 'react';

import type { RequestType } from '@acme/db/schema';
import { Button } from '@acme/ui/components/button';
import { ScrollArea } from '@acme/ui/components/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@acme/ui/components/tabs';
import { cn } from '@acme/ui/lib/utils';

interface LogDetailsProps {
  request: RequestType;
  onClose: () => void;
}

export function RequestDetails({ request, onClose }: LogDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

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
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => setIsExpanded(!isExpanded)}
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
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => handleCopy(request)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="request" className="h-[calc(100%-40px)]">
        <div className="border-b border-zinc-800 px-4">
          <TabsList className="h-9 bg-black">
            <TabsTrigger
              value="request"
              className="h-8 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
            >
              Request
            </TabsTrigger>
            <TabsTrigger
              value="response"
              className="h-8 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
            >
              Response
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="h-8 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
            >
              Headers
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="h-[calc(100%-40px)]">
          <TabsContent value="request" className="m-0 p-4">
            <pre className="font-mono text-xs text-zinc-300">
              {JSON.stringify(request.request, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent value="response" className="m-0 p-4">
            <pre className="font-mono text-xs text-zinc-300">
              {JSON.stringify(request.response, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent value="headers" className="m-0 p-4">
            <pre className="font-mono text-xs text-zinc-300">
              {JSON.stringify(request.request.headers, null, 2)}
            </pre>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
