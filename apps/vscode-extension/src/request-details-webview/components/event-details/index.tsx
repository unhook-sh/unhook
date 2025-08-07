// import { HeadersList } from '../shared/headers-list';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@unhook/ui/collapsible';
import { Icons } from '@unhook/ui/custom/icons';
import { Separator } from '@unhook/ui/separator';
import { useState } from 'react';
import { JsonViewer } from '../json-viewer';
import { EventHeader } from './header';
import { RequestCard } from './request-card';

export interface EventDetailsProps {
  data: EventTypeWithRequest;
}

export function EventDetails({ data }: EventDetailsProps) {
  const [headersOpen, setHeadersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const requestCount = data.requests?.length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <EventHeader data={data} />

        {/* Enhanced Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Event Payload - Primary Focus */}
          <div className="xl:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icons.ExternalLink className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Event Payload
                </h2>
              </div>

              {data.originRequest?.body ? (
                <JsonViewer
                  className="shadow-sm"
                  data={data.originRequest.body}
                  defaultExpanded={true}
                  maxHeight={500}
                  title="Webhook Data"
                />
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Icons.X className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No payload data available
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      This event was received without a body
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Request Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icons.ArrowRight className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Forwarded Requests
                  </h2>
                </div>
                <Badge className="text-sm" variant="outline">
                  {requestCount} total
                </Badge>
              </div>

              <div className="space-y-3">
                {data.requests && data.requests.length > 0 ? (
                  data.requests.map((request, index) => (
                    <RequestCard
                      event={data}
                      index={index}
                      key={request.id}
                      request={request}
                    />
                  ))
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Icons.Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground font-medium">
                        No requests found
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        This event hasn't been forwarded to any destinations
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Event Metadata - Sidebar */}
          <div className="space-y-6">
            {/* Request Summary */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Icons.BarChart2 className="h-4 w-4" />
                  Request Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {data.requests?.filter((r) => r.status === 'completed')
                        .length || 0}
                    </div>
                    <div className="text-xs text-primary font-medium">
                      Successful
                    </div>
                  </div>
                  <div className="text-center p-3 bg-destructive/10 rounded-lg">
                    <div className="text-2xl font-bold text-destructive">
                      {data.requests?.filter((r) => r.status === 'failed')
                        .length || 0}
                    </div>
                    <div className="text-xs text-destructive font-medium">
                      Failed
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Requests:
                    </span>
                    <span className="font-medium">{requestCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="font-medium">
                      {requestCount > 0
                        ? Math.round(
                            ((data.requests?.filter(
                              (r) => r.status === 'completed',
                            ).length || 0) /
                              requestCount) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Response:</span>
                    <span className="font-medium">
                      {requestCount > 0
                        ? Math.round(
                            (data.requests?.reduce(
                              (acc, r) => acc + (r.responseTimeMs || 0),
                              0,
                            ) || 0) / requestCount,
                          )
                        : 0}
                      ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Headers */}
            <Collapsible onOpenChange={setHeadersOpen} open={headersOpen}>
              <Card className="shadow-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icons.ExternalLink className="h-4 w-4" />
                        Request Headers
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs" variant="secondary">
                          {
                            Object.keys(data.originRequest?.headers ?? {})
                              .length
                          }
                        </Badge>
                        {headersOpen ? (
                          <Icons.ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Icons.ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {Object.keys(data.originRequest?.headers ?? {}).length >
                    0 ? (
                      <div className="bg-muted/50 rounded-lg p-3 max-h-64 overflow-auto">
                        <div className="space-y-1">
                          {Object.entries(
                            data.originRequest?.headers ?? {},
                          ).map(([key, value]) => (
                            <div className="flex text-xs font-mono" key={key}>
                              <span className="text-primary w-32 flex-shrink-0 font-medium">
                                {key}:
                              </span>
                              <span className="text-foreground break-all">
                                {value as string}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No headers available
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Technical Details */}
            <Collapsible onOpenChange={setDetailsOpen} open={detailsOpen}>
              <Card className="shadow-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icons.Settings className="h-4 w-4" />
                        Technical Details
                      </CardTitle>
                      {detailsOpen ? (
                        <Icons.ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Icons.ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">
                          HTTP Method:
                        </span>
                        <Badge className="text-xs font-mono" variant="outline">
                          {data.originRequest?.method || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">
                          Content Type:
                        </span>
                        <span
                          className="text-xs font-mono max-w-32 truncate"
                          title={data.originRequest?.contentType}
                        >
                          {data.originRequest?.contentType || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">
                          Request Size:
                        </span>
                        <span className="font-mono text-xs">
                          {data.originRequest?.size
                            ? `${data.originRequest.size} bytes`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">
                          Client IP:
                        </span>
                        <span className="font-mono text-xs">
                          {data.originRequest?.clientIp || 'N/A'}
                        </span>
                      </div>
                      <Separator />
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs font-medium">
                          Source URL:
                        </span>
                        <div className="bg-muted/50 rounded p-2 text-xs font-mono break-all">
                          {data.originRequest?.sourceUrl || 'N/A'}
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
    </div>
  );
}
