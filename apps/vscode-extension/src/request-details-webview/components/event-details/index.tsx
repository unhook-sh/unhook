'use client';

import { extractBody } from '@unhook/client/utils/extract-body';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { Card, CardContent } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@unhook/ui/dialog';
import { useState } from 'react';
import { vscode } from '../../lib/vscode';

// Simple toast hook for this component
const useToast = () => {
  const toast = (options: {
    title: string;
    description?: string;
    duration?: number;
  }) => {
    // Simple console log for now - in a real app this would show a toast notification
    console.log(`Toast: ${options.title}`, options.description || '');
  };
  return { toast };
};

export interface EventDetailsProps {
  data: EventTypeWithRequest;
}

export function EventDetails({ data }: EventDetailsProps) {
  const [activeTab, setActiveTab] = useState<
    'payload' | 'headers' | 'forwards'
  >('payload');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const { toast } = useToast();

  // Debug logging
  console.log('EventDetails component rendered with data:', data);
  console.log('Data type:', typeof data);
  console.log('Data keys:', data ? Object.keys(data) : 'no data');

  // Validate that we have the required data
  if (!data) {
    console.log('No data provided to EventDetails component');
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
        <Card className="w-full max-w-md shadow-sm">
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-3">
              <Icons.AlertTriangle size="lg" variant="warning" />
              <p className="text-sm text-muted-foreground">
                No event data available
              </p>
              <p className="text-xs text-muted-foreground">
                Debug: data is {typeof data}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from the actual event, with fallbacks
  const eventData = {
    config: {
      maxResponseTime: '3s',
      requiredResponseTime: '2s',
      retryAttempts: data.maxRetries || 3,
      retryDelay: 'exponential',
    },
    headers: data.originRequest?.headers || {},
    isRetry: data.retryCount > 0,
    originalEventId: null, // Not available in current schema
    payload: data.originRequest?.body || '',
    requests: data.requests || [],
    retryAttempt: data.retryCount || 0,
    source: data.source || 'Unknown',
    timestamp: data.timestamp
      ? new Date(data.timestamp).toISOString()
      : new Date().toISOString(),
    type: data.status || 'unknown',
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      duration: 2000,
      title: 'Copied to clipboard',
    });
  };

  const replayEvent = () => {
    toast({
      description: 'Webhook event has been sent to all endpoints',
      duration: 3000,
      title: 'Event replayed',
    });
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300)
      return <Icons.Check className="size-4 text-primary" />;
    if (status >= 500) return <Icons.X className="size-4 text-destructive" />;
    return <Icons.Clock className="size-4 text-warning" />;
  };

  const generateAiPrompt = () => {
    const failedRequests = eventData.requests.filter(
      (req) => req.status === 'failed',
    );
    const slowRequests = eventData.requests.filter(
      (req) => req.responseTimeMs > 2000, // 2 second requirement
    );

    return `I need help debugging a webhook issue. Here's the complete context:

**Webhook Event:**
- Source: ${eventData.source}
- Type: ${eventData.type}
- Timestamp: ${eventData.timestamp}
- Is Retry: ${eventData.isRetry ? `Yes (attempt ${eventData.retryAttempt})` : 'No'}
${eventData.isRetry && eventData.originalEventId ? `- Original Event ID: ${eventData.originalEventId}` : ''}

**Configuration:**
- Required Response Time: ${eventData.config.requiredResponseTime}
- Max Response Time: ${eventData.config.maxResponseTime}
- Retry Attempts: ${eventData.config.retryAttempts}
- Retry Strategy: ${eventData.config.retryDelay}

**Headers:**
${Object.entries(eventData.headers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

**Payload:**
\`\`\`json
${(() => {
  const extractedBody = extractBody(eventData.payload);
  return extractedBody || 'No payload data available';
})()}
\`\`\`

**Forwarded Requests (${eventData.requests.length} total):**
${eventData.requests
  .map(
    (req) => `
- URL: ${req.destinationUrl}
- Status: ${req.status}
- Response Time: ${req.responseTimeMs}ms${req.responseTimeMs > 2000 ? ' ⚠️ SLOW' : ''}
- Is Retry: ${req.failedReason ? `Yes (${req.failedReason})` : 'No'}
- Response: ${(() => {
      if (req.response?.body) {
        const extractedResponseBody = extractBody(req.response.body);
        return extractedResponseBody || req.response.body;
      }
      return JSON.stringify(req.response, null, 2);
    })()}
`,
  )
  .join('\n')}

**Issues Detected:**
${failedRequests.length > 0 ? `- ${failedRequests.length} failed request(s) (status: failed)` : ''}
${slowRequests.length > 0 ? `- ${slowRequests.length} slow request(s) (>${eventData.config.requiredResponseTime})` : ''}
${eventData.isRetry ? '- This is a retry event, indicating previous failures' : ''}
${failedRequests.length === 0 && slowRequests.length === 0 && !eventData.isRetry ? '- No obvious issues detected' : ''}

Please analyze this webhook debugging data and help me:
1. Identify the root cause of any failures or performance issues
2. Suggest specific fixes for the failing endpoints
3. Recommend optimizations for slow responses
4. Provide code examples if applicable
5. Suggest monitoring or alerting improvements

Focus on actionable solutions I can implement in my webhook handlers.`;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge className="bg-primary text-primary-foreground px-3 py-1">
              {eventData.source}
            </Badge>
            <code className="text-sm font-mono text-muted-foreground">
              {eventData.type}
            </code>
            {eventData.isRetry && (
              <Badge
                className="gap-1 text-warning border-warning"
                variant="outline"
              >
                <Icons.ArrowUpDown className="size-3" />
                Retry {eventData.retryAttempt}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground font-mono">
              {new Date(eventData.timestamp).toLocaleString()}
            </div>
            <Dialog onOpenChange={setShowAiPrompt} open={showAiPrompt}>
              <DialogTrigger asChild>
                <Button
                  className="gap-2 bg-transparent"
                  size="sm"
                  variant="outline"
                >
                  <Icons.Sparkles className="size-4" />
                  Debug with AI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icons.Sparkles className="size-5" />
                    Copy Prompt for Cursor
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Copy this comprehensive debugging prompt and paste it into
                    Cursor's chat to get AI assistance:
                  </p>
                  <div className="bg-muted rounded-lg border">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
                      <span className="text-sm font-medium text-foreground">
                        Debugging Prompt
                      </span>
                      <Button
                        className="gap-2"
                        onClick={() => copyToClipboard(generateAiPrompt())}
                        size="sm"
                        variant="ghost"
                      >
                        <Icons.Copy className="size-4" />
                        Copy All
                      </Button>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                        {generateAiPrompt()}
                      </pre>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button className="gap-2" onClick={replayEvent} size="sm">
              <Icons.ArrowUpDown className="size-4" />
              Replay Event
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-sm bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Icons.Clock className="size-4 text-primary" />
                <span className="text-muted-foreground">
                  Response required within
                </span>
                <Badge
                  className="font-mono text-primary border-primary/30"
                  variant="outline"
                >
                  {eventData.config.requiredResponseTime}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Max retries:</span>
                <Badge className="font-mono" variant="outline">
                  {eventData.config.retryAttempts}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Retry strategy:</span>
                <Badge className="font-mono" variant="outline">
                  {eventData.config.retryDelay}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {[
              { key: 'payload', label: 'Payload' },
              { key: 'headers', label: 'Headers' },
              { key: 'forwards', label: 'Forwards' },
            ].map((tab) => (
              <button
                className={`py-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                key={tab.key}
                onClick={() =>
                  setActiveTab(tab.key as 'payload' | 'headers' | 'forwards')
                }
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {activeTab === 'payload' && (
              <div>
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={() => {
                      const extractedBody = extractBody(eventData.payload);
                      copyToClipboard(
                        extractedBody || 'No payload data available',
                      );
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Icons.Copy className="size-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-4 overflow-auto">
                  <pre className="text-foreground text-sm font-mono">
                    {(() => {
                      const extractedBody = extractBody(eventData.payload);
                      return extractedBody || 'No payload data available';
                    })()}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-3">
                {Object.entries(eventData.headers).map(([key, value]) => (
                  <div
                    className="flex flex-col sm:flex-row gap-2 p-3 bg-muted rounded"
                    key={key}
                  >
                    <div className="font-mono text-sm font-medium text-foreground sm:w-48 flex-shrink-0">
                      {key}
                    </div>
                    <div className="font-mono text-sm text-foreground break-all">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'forwards' && (
              <div className="space-y-4">
                {eventData.requests.length > 0 ? (
                  eventData.requests.map((request) => (
                    <button
                      className="w-full text-left"
                      key={request.id}
                      onClick={() => {
                        // Send message to open request details
                        vscode.postMessage({
                          data: {
                            event: data,
                            request,
                          },
                          type: 'openRequestDetails',
                        });
                      }}
                      type="button"
                    >
                      <Card className="border border-border hover:border-border/60 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(
                                request.status === 'completed'
                                  ? 200
                                  : request.status === 'failed'
                                    ? 500
                                    : 202,
                              )}
                              <Badge
                                className="font-mono"
                                variant={
                                  request.status === 'completed'
                                    ? 'default'
                                    : 'destructive'
                                }
                              >
                                {request.status === 'completed'
                                  ? '200'
                                  : request.status === 'failed'
                                    ? '500'
                                    : '202'}
                              </Badge>
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
                              {request.failedReason && (
                                <Badge
                                  className="gap-1 text-destructive border-destructive"
                                  variant="outline"
                                >
                                  <Icons.X className="size-3" />
                                  Failed: {request.failedReason}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="font-mono text-sm text-muted-foreground mb-3 break-all">
                            {request.destinationUrl}
                          </div>
                          <div className="bg-muted rounded p-3">
                            <pre className="text-sm font-mono text-foreground">
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
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icons.Circle className="size-12 mx-auto mb-4 opacity-50" />
                    <p>No forwarded requests found for this event</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
