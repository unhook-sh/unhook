import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Card, CardContent } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { JsonViewer } from '../json-viewer';

export interface EventPayloadProps {
  data: EventTypeWithRequest;
}

export function EventPayload({ data }: EventPayloadProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icons.ExternalLink className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Event Payload</h2>
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
  );
}
