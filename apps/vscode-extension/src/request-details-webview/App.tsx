// biome-ignore lint/style/useFilenamingConvention: rename to app.tsx

import { extractBody } from '@unhook/client/utils/extract-body';
import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type {
  EventTypeWithRequest,
  RequestTypeWithEventType,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@unhook/ui/collapsible';
import { Icons } from '@unhook/ui/custom/icons';
import { TimeDisplay } from '@unhook/ui/custom/time-display';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { useEffect, useState } from 'react';

const log = debug('unhook:vscode:request-details-webview');

// Types
// VSCode API type declaration
declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

// Get the VS Code API
const vscode = window.acquireVsCodeApi?.() || {
  postMessage: (message: unknown) => {
    log('VSCode API not available, posting to parent', message);
    window.parent.postMessage(message, '*');
  },
};

// Event Visualizer Component
function EventVisualizer({ data }: { data: EventTypeWithRequest }) {
  const [headersOpen, setHeadersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-primary text-primary-foreground';
    if (status === 'failed')
      return 'bg-destructive text-destructive-foreground';
    if (status === 'pending') return 'bg-warning text-warning-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <Icons.CheckCircle2 size="sm" />;
    if (status === 'failed') return <Icons.X size="sm" />;
    if (status === 'pending') return <Icons.Clock size="sm" />;
    return <Icons.Clock size="sm" />;
  };

  const eventName = extractEventName(data.originRequest?.body);
  const source = data.source || 'Unknown';
  const requestCount = data.requests?.length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Icons.Sparkles className="text-primary" size="sm" />
                  <CardTitle className="text-xl text-card-foreground">
                    {eventName}
                  </CardTitle>
                </div>
                <Badge
                  className={`${getStatusColor(data.status)} flex items-center gap-1`}
                >
                  {getStatusIcon(data.status)}
                  {data.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-2">
                <Icons.PanelLeft size="sm" />
                <span>Source: {source}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.Calendar size="sm" />
                <span>
                  {data.timestamp ? (
                    <TimeDisplay date={data.timestamp} showRelative={true} />
                  ) : (
                    'No timestamp'
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.ArrowRight size="sm" />
                <span>
                  {requestCount} request{requestCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <Tabs className="w-full" defaultValue="payload">
              <TabsList className="bg-muted border-border">
                <TabsTrigger
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  value="payload"
                >
                  Event Payload
                </TabsTrigger>
                <TabsTrigger
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  value="requests"
                >
                  Requests ({requestCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent className="mt-4" value="payload">
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <pre className="text-sm font-mono text-foreground overflow-x-auto">
                    {data.originRequest?.body
                      ? extractBody(data.originRequest.body)
                      : 'No event payload'}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent className="mt-4" value="requests">
                <div className="space-y-4">
                  {data.requests && data.requests.length > 0 ? (
                    data.requests.map((request) => (
                      <Card className="bg-muted border-border" key={request.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {request.destination?.name || 'Unknown'}
                              </span>
                              <Badge
                                className={`${getStatusColor(request.status)} flex items-center gap-1`}
                              >
                                {getStatusIcon(request.status)}
                                {request.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.responseTimeMs || 0}ms
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.destination?.url}
                          </div>
                          {request.failedReason && (
                            <div className="mt-2 text-sm text-destructive">
                              Error: {request.failedReason}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No requests found for this event
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {/* Headers */}
          <Collapsible onOpenChange={setHeadersOpen} open={headersOpen}>
            <Card className="bg-card border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-card-foreground">
                      Event Headers
                    </CardTitle>
                    {headersOpen ? (
                      <Icons.ChevronDown
                        className="text-muted-foreground"
                        size="sm"
                      />
                    ) : (
                      <Icons.ChevronRight
                        className="text-muted-foreground"
                        size="sm"
                      />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="bg-muted rounded-lg p-4 border border-border">
                    <div className="space-y-2">
                      {Object.entries(data.originRequest?.headers ?? {}).map(
                        ([key, value]) => (
                          <div className="flex text-sm font-mono" key={key}>
                            <span className="text-primary w-48 flex-shrink-0">
                              {key}:
                            </span>
                            <span className="text-foreground break-all">
                              {value as string}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Additional Details */}
          <Collapsible onOpenChange={setDetailsOpen} open={detailsOpen}>
            <Card className="bg-card border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-card-foreground">
                      Additional Details
                    </CardTitle>
                    {detailsOpen ? (
                      <Icons.ChevronDown
                        className="text-muted-foreground"
                        size="sm"
                      />
                    ) : (
                      <Icons.ChevronRight
                        className="text-muted-foreground"
                        size="sm"
                      />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Event Type:
                        </span>
                        <span className="text-foreground">{eventName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <span className="text-foreground">{source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="text-foreground">{data.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="text-foreground">
                          {data.originRequest?.method}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Request Count:
                        </span>
                        <span className="text-foreground">{requestCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Content Type:
                        </span>
                        <span className="text-foreground">
                          {data.originRequest?.contentType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Request Size:
                        </span>
                        <span className="text-foreground">
                          {data.originRequest?.size} bytes
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Client IP:
                        </span>
                        <span className="text-foreground">
                          {data.originRequest?.clientIp}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">URL:</span>
                        <span className="text-foreground break-all">
                          {data.originRequest?.sourceUrl}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

// Webhook Visualizer Component
function WebhookVisualizer({ data }: { data: RequestTypeWithEventType }) {
  const [isReplaying, setIsReplaying] = useState(false);
  const [headersOpen, setHeadersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleReplay = async () => {
    setIsReplaying(true);
    try {
      vscode.postMessage({
        requestId: data.id,
        type: 'replayRequest',
      });
    } finally {
      setTimeout(() => setIsReplaying(false), 1000);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300)
      return 'bg-primary text-primary-foreground';
    if (status >= 400 && status < 500)
      return 'bg-warning text-warning-foreground';
    if (status >= 500) return 'bg-destructive text-destructive-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <Icons.CheckCircle2 size="sm" />;
    if (status >= 400) return <Icons.X size="sm" />;
    return <Icons.Clock size="sm" />;
  };

  const status = data.response?.status || 0;
  const eventName = extractEventName(data.event?.originRequest.body);
  const source = data.source || 'Unknown';

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Icons.Sparkles className="text-primary" size="sm" />
                  <CardTitle className="text-xl text-card-foreground">
                    {eventName}
                  </CardTitle>
                </div>
                <Badge
                  className={`${getStatusColor(status)} flex items-center gap-1`}
                >
                  {getStatusIcon(status)}
                  {status || 'Pending'}
                </Badge>
              </div>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isReplaying}
                onClick={handleReplay}
              >
                <Icons.Play className="mr-2" size="sm" />
                {isReplaying ? 'Replaying...' : 'Replay Event'}
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-2">
                <Icons.PanelLeft size="sm" />
                <span>Source: {source}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.Calendar size="sm" />
                <span>
                  {data.timestamp ? (
                    <TimeDisplay date={data.timestamp} showRelative={true} />
                  ) : (
                    'No timestamp'
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.Clock size="sm" />
                <span>{data.responseTimeMs || 0}ms</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <Tabs className="w-full" defaultValue="request">
              <TabsList className="bg-muted border-border">
                <TabsTrigger
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  value="request"
                >
                  Request Payload
                </TabsTrigger>
                <TabsTrigger
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  value="response"
                >
                  Response
                </TabsTrigger>
              </TabsList>

              <TabsContent className="mt-4" value="request">
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <pre className="text-sm font-mono text-foreground overflow-x-auto">
                    {data.event?.originRequest.body
                      ? extractBody(data.event.originRequest.body)
                      : 'No request body'}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent className="mt-4" value="response">
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <pre className="text-sm font-mono text-foreground overflow-x-auto">
                    {data.response?.body
                      ? extractBody(data.response.body)
                      : 'No response body'}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {/* Headers */}
          <Collapsible onOpenChange={setHeadersOpen} open={headersOpen}>
            <Card className="bg-card border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-card-foreground">
                      Request Headers
                    </CardTitle>
                    {headersOpen ? (
                      <Icons.ChevronDown
                        className="text-muted-foreground"
                        size="sm"
                      />
                    ) : (
                      <Icons.ChevronRight
                        className="text-muted-foreground"
                        size="sm"
                      />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="bg-muted rounded-lg p-4 border border-border">
                    <div className="space-y-2">
                      {Object.entries(
                        data.event?.originRequest.headers ?? {},
                      ).map(([key, value]) => (
                        <div className="flex text-sm font-mono" key={key}>
                          <span className="text-primary w-48 flex-shrink-0">
                            {key}:
                          </span>
                          <span className="text-foreground break-all">
                            {value as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Response Headers */}
          {data.response && (
            <Collapsible onOpenChange={setHeadersOpen} open={headersOpen}>
              <Card className="bg-card border-border">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-card-foreground">
                        Response Headers
                      </CardTitle>
                      {headersOpen ? (
                        <Icons.ChevronDown
                          className="text-muted-foreground"
                          size="sm"
                        />
                      ) : (
                        <Icons.ChevronRight
                          className="text-muted-foreground"
                          size="sm"
                        />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="bg-muted rounded-lg p-4 border border-border">
                      <div className="space-y-2">
                        {Object.entries(data.response.headers).map(
                          ([key, value]) => (
                            <div className="flex text-sm font-mono" key={key}>
                              <span className="text-primary w-48 flex-shrink-0">
                                {key}:
                              </span>
                              <span className="text-foreground break-all">
                                {value}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Additional Details */}
          <Collapsible onOpenChange={setDetailsOpen} open={detailsOpen}>
            <Card className="bg-card border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-card-foreground">
                      Additional Details
                    </CardTitle>
                    {detailsOpen ? (
                      <Icons.ChevronDown
                        className="text-muted-foreground"
                        size="sm"
                      />
                    ) : (
                      <Icons.ChevronRight
                        className="text-muted-foreground"
                        size="sm"
                      />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Event Type:
                        </span>
                        <span className="text-foreground">{eventName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <span className="text-foreground">{source}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="text-foreground">
                          {data.event?.originRequest.method}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Content Type:
                        </span>
                        <span className="text-foreground">
                          {data.event?.originRequest.contentType}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Status Code:
                        </span>
                        <span className="text-foreground">
                          {status || 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Response Time:
                        </span>
                        <span className="text-foreground">
                          {data.responseTimeMs || 0}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Request Size:
                        </span>
                        <span className="text-foreground">
                          {data.event?.originRequest.size} bytes
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Client IP:
                        </span>
                        <span className="text-foreground">
                          {data.event?.originRequest.clientIp}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">URL:</span>
                        <span className="text-foreground break-all">
                          {data.event?.originRequest.sourceUrl}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Error Section */}
          {data.failedReason && (
            <Card className="bg-card border-destructive">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <Icons.AlertTriangle size="sm" />
                  Failure Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive">{data.failedReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <Card className="w-full max-w-md bg-card border-border">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="rounded-full bg-muted p-3">
            <Icons.MessageCircleQuestion
              className="text-muted-foreground"
              size="lg"
            />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-card-foreground">
              No Data Selected
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Select an event or request from the events view to see its details
              here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error State Component
function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <Card className="w-full max-w-md bg-card border-destructive">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="rounded-full bg-destructive/10 p-3">
            <Icons.AlertCircle className="text-destructive" size="lg" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error</h3>
            <p className="text-sm text-destructive mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main App Component
function App() {
  const [requestData, setRequestData] =
    useState<RequestTypeWithEventType | null>(null);
  const [eventData, setEventData] = useState<EventTypeWithRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Setting up message handler');
    // Listen for messages from the extension
    const messageHandler = (
      event: MessageEvent<{
        data: RequestTypeWithEventType | EventTypeWithRequest;
        type: 'requestData' | 'eventData';
      }>,
    ) => {
      try {
        const message = event.data;
        console.log('Received message from extension', { message });
        switch (message.type) {
          case 'requestData':
            console.log('Setting request data', {
              requestId: (message.data as RequestTypeWithEventType).id,
            });
            setRequestData(message.data as RequestTypeWithEventType);
            setEventData(null);
            setError(null);
            break;
          case 'eventData':
            console.log('Setting event data', {
              eventId: (message.data as EventTypeWithRequest).id,
            });
            setEventData(message.data as EventTypeWithRequest);
            setRequestData(null);
            setError(null);
            break;
          default:
            console.log('Unknown message type', { type: message.type });
        }
      } catch (err) {
        console.error('Error handling message', { error: err });
        setError('Error processing data');
      }
    };

    window.addEventListener('message', messageHandler);
    // Notify the extension that the webview is ready
    log('Sending ready message to extension');
    vscode.postMessage({ type: 'ready' });

    return () => {
      console.log('Cleaning up message handler');
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  if (error) {
    return <ErrorState error={error} />;
  }

  if (requestData) {
    return <WebhookVisualizer data={requestData} />;
  }

  if (eventData) {
    return <EventVisualizer data={eventData} />;
  }

  return <EmptyState />;
}

export default App;
