'use client';

import { MetricButton } from '@unhook/analytics/components';
import { Badge } from '@unhook/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@unhook/ui/collapsible';
import { Icons } from '@unhook/ui/custom/icons';
import { TimezoneDisplay } from '@unhook/ui/custom/timezone-display';
import { ScrollArea } from '@unhook/ui/scroll-area';
import { useState } from 'react';

interface WebhookResult {
  id: number;
  timestamp: string;
  webhookId: string;
  service: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'success' | 'error';
  response?: { status: number; message: string };
  error?: string;
}

interface ResultsDisplayProps {
  results: WebhookResult[];
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [expandedResults, setExpandedResults] = useState<Set<number>>(
    new Set(),
  );

  const toggleResult = (id: number) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResults(newExpanded);
  };

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Icons.BarChart2 className="text-muted-foreground mb-4" size="lg" />
        <p className="text-muted-foreground">No webhook results yet</p>
        <p className="text-sm text-muted-foreground">
          Send a webhook to see results here
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-3">
        {results.map((result) => (
          <div className="border rounded-lg p-4 space-y-3" key={result.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.status === 'success' ? (
                  <Icons.CheckCircle2 className="text-green-500" size="sm" />
                ) : (
                  <Icons.CircleStop className="text-red-500" size="sm" />
                )}
                <Badge
                  variant={
                    result.status === 'success' ? 'default' : 'destructive'
                  }
                >
                  {result.status}
                </Badge>
                <span className="text-sm font-medium">{result.service}</span>
                <span className="text-sm text-muted-foreground">
                  {result.eventType}
                </span>
              </div>
              <TimezoneDisplay date={result.timestamp} />
            </div>

            <div className="text-sm text-muted-foreground">
              <span>Webhook: </span>
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                {result.webhookId}
              </code>
            </div>

            {result.response && (
              <div className="text-sm">
                <span className="text-muted-foreground">Response: </span>
                <Badge className="ml-1" variant="outline">
                  {result.response.status}
                </Badge>
                <span className="ml-2">{result.response.message}</span>
              </div>
            )}

            {result.error && (
              <div className="text-sm text-destructive">
                <span>Error: </span>
                {result.error}
              </div>
            )}

            <Collapsible
              onOpenChange={() => toggleResult(result.id)}
              open={expandedResults.has(result.id)}
            >
              <CollapsibleTrigger asChild>
                <MetricButton
                  className="h-auto p-0"
                  metric="playground_results_view_payload_clicked"
                  size="sm"
                  variant="ghost"
                >
                  <Icons.ChevronDown
                    className={`mr-1 transition-transform ${
                      expandedResults.has(result.id) ? 'rotate-180' : ''
                    }`}
                    size="sm"
                  />
                  View Payload
                </MetricButton>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
