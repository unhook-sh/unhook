import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { Card, CardContent } from '@unhook/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@unhook/ui/collapsible';
import { Icons } from '@unhook/ui/custom/icons';
import { useState } from 'react';
import { trackRequestCardInteraction } from '../../lib/analytics';
import { JsonViewer } from '../json-viewer';

interface RequestCardProps {
  request: NonNullable<EventTypeWithRequest['requests']>[number];
  event: EventTypeWithRequest;
  index: number;
}

function getStatusColor(status: string) {
  if (status === 'completed') return 'bg-primary/10 text-primary border-border';
  if (status === 'failed')
    return 'bg-destructive/10 text-destructive border-destructive/20';
  if (status === 'pending')
    return 'bg-accent text-accent-foreground border-border';
  return 'bg-muted text-muted-foreground border-border';
}

function getStatusIcon(status: string) {
  if (status === 'completed') return <Icons.CheckCircle2 className="h-3 w-3" />;
  if (status === 'failed') return <Icons.X className="h-3 w-3" />;
  if (status === 'pending') return <Icons.Clock className="h-3 w-3" />;
  return <Icons.Clock className="h-3 w-3" />;
}

function getMethodColor(method?: string) {
  switch (method?.toUpperCase()) {
    case 'GET':
      return 'bg-secondary text-secondary-foreground';
    case 'POST':
      return 'bg-primary/10 text-primary';
    case 'PUT':
      return 'bg-accent text-accent-foreground';
    case 'DELETE':
      return 'bg-destructive/10 text-destructive';
    case 'PATCH':
      return 'bg-muted text-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function RequestCard({ request, event, index }: RequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandChange = (expanded: boolean) => {
    setIsExpanded(expanded);
    trackRequestCardInteraction('request_card_expanded', {
      destination_name: request.destination?.name,
      event_id: event.id,
      expanded,
      request_id: request.id,
      status: request.status,
    });
  };

  const copyUrl = () => {
    if (request.destination?.url) {
      navigator.clipboard.writeText(request.destination.url);
      trackRequestCardInteraction('destination_url_copied', {
        destination_name: request.destination?.name,
        event_id: event.id,
        request_id: request.id,
        url_length: request.destination.url.length,
      });
    }
  };
  const copyRequestBody = () => {
    const body = event?.originRequest?.body;
    if (body) {
      navigator.clipboard.writeText(body);
      trackRequestCardInteraction('request_body_copied', {
        body_length: body.length,
        destination_name: request.destination?.name,
        event_id: event.id,
        request_id: request.id,
      });
    }
  };
  const copyResponseBody = () => {
    const body = request.response?.body;
    if (body) {
      navigator.clipboard.writeText(String(body));
      trackRequestCardInteraction('response_body_copied', {
        body_length: String(body).length,
        destination_name: request.destination?.name,
        event_id: event.id,
        request_id: request.id,
      });
    }
  };

  return (
    <Card className="border border-border hover:border-accent transition-colors">
      <Collapsible onOpenChange={handleExpandChange} open={isExpanded}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <Icons.ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Icons.ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {request.destination?.name || 'Unknown Destination'}
                  </span>
                  <Badge
                    className={`${getStatusColor(request.status)} flex items-center gap-1 border`}
                  >
                    {getStatusIcon(request.status)}
                    {request.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Icons.Clock className="h-3 w-3" />
                  <span>{request.responseTimeMs || 0}ms</span>
                </div>
                {event?.originRequest?.method && (
                  <Badge
                    className={`${getMethodColor(event.originRequest.method)} text-xs font-mono`}
                  >
                    {event.originRequest.method}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Icons.ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground font-mono truncate">
                {request.destination?.url}
              </span>
            </div>

            {request.failedReason && (
              <div className="mt-2 flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                <Icons.AlertCircle className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
                <span className="text-sm text-destructive">
                  {request.failedReason}
                </span>
              </div>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Icons.ArrowRight className="h-3 w-3" />
                    Request Details
                  </h4>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Status Code:</span>
                      <span className="font-mono">
                        {request.response?.status ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Content Type:</span>
                      <span
                        className="font-mono text-xs truncate max-w-32"
                        title={event?.originRequest?.contentType || 'N/A'}
                      >
                        {event?.originRequest?.contentType || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-mono">
                        {event?.originRequest?.size || 0} bytes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Icons.ArrowLeft className="h-3 w-3" />
                    Response Details
                  </h4>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span className="font-mono">
                        {request.responseTimeMs || 0}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Size:</span>
                      <span className="font-mono">
                        {request.response?.body
                          ? String(request.response.body).length
                          : 0}{' '}
                        bytes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retry Count:</span>
                      <span className="font-mono">
                        {event?.retryCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Icons.ExternalLink className="h-3 w-3" />
                    Destination URL
                  </h4>
                  <Button
                    className="text-xs"
                    onClick={copyUrl}
                    size="sm"
                    variant="ghost"
                  >
                    <Icons.Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-muted rounded p-3 font-mono text-sm break-all">
                  {request.destination?.url}
                </div>
              </div>

              {event?.originRequest?.body && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Icons.ExternalLink className="h-3 w-3" />
                      Request Body
                    </h4>
                    <Button
                      className="text-xs"
                      onClick={copyRequestBody}
                      size="sm"
                      variant="ghost"
                    >
                      <Icons.Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <JsonViewer
                    data={event.originRequest.body}
                    defaultExpanded={false}
                    maxHeight={300}
                    title="Request Payload"
                  />
                </div>
              )}

              {request.response?.body && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Icons.ExternalLink className="h-3 w-3" />
                      Response Body
                    </h4>
                    <Button
                      className="text-xs"
                      onClick={copyResponseBody}
                      size="sm"
                      variant="ghost"
                    >
                      <Icons.Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <JsonViewer
                    data={request.response.body}
                    defaultExpanded={false}
                    maxHeight={300}
                    title="Response Data"
                  />
                </div>
              )}
            </CardContent>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
