import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { Card, CardHeader, CardTitle } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { TimeDisplay } from '@unhook/ui/custom/time-display';

export interface RequestHeaderProps {
  data: RequestTypeWithEventType;
  isReplaying: boolean;
  onReplay: () => void;
}

function getStatusColor(status: number) {
  if (status >= 200 && status < 300)
    return 'bg-primary text-primary-foreground';
  if (status >= 400 && status < 500)
    return 'bg-warning text-warning-foreground';
  if (status >= 500) return 'bg-destructive text-destructive-foreground';
  return 'bg-muted text-muted-foreground';
}

function getStatusIcon(status: number) {
  if (status >= 200 && status < 300) return <Icons.CheckCircle2 size="sm" />;
  if (status >= 400) return <Icons.X size="sm" />;
  return <Icons.Clock size="sm" />;
}

export function RequestHeader({
  data,
  isReplaying,
  onReplay,
}: RequestHeaderProps) {
  const status = data.response?.status || 0;
  const eventName = extractEventName(data.event?.originRequest.body);
  const source = data.source || 'Unknown';

  return (
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
            onClick={onReplay}
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
  );
}
