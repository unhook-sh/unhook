import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Card, CardHeader, CardTitle } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { TimeDisplay } from '@unhook/ui/custom/time-display';

export interface EventHeaderProps {
  data: EventTypeWithRequest;
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
  if (status === 'completed') return <Icons.CheckCircle2 className="h-4 w-4" />;
  if (status === 'failed') return <Icons.X className="h-4 w-4" />;
  if (status === 'pending') return <Icons.Clock className="h-4 w-4" />;
  return <Icons.Clock className="h-4 w-4" />;
}

export function EventHeader({ data }: EventHeaderProps) {
  const extracted = extractEventName(data.originRequest?.body);
  const eventName = extracted || 'Webhook Event';
  const source = data.source || 'Unknown';
  const requestCount = data.requests?.length || 0;

  return (
    <Card className="bg-gradient-to-r from-card to-accent/5 border-border shadow-sm">
      <CardHeader className="pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icons.Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {eventName}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Event ID:{' '}
                  <span className="font-mono text-xs">{data.id || 'N/A'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Badge
                className={`${getStatusColor(data.status)} flex items-center gap-2 px-3 py-1 border font-medium`}
              >
                {getStatusIcon(data.status)}
                {data.status.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icons.Home className="h-4 w-4" />
                <span className="font-medium">{source}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icons.Clock className="h-4 w-4" />
                {data.timestamp ? (
                  <TimeDisplay date={data.timestamp} showRelative={true} />
                ) : (
                  'No timestamp'
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icons.ArrowRight className="h-4 w-4" />
                <span>
                  {requestCount} destination{requestCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
