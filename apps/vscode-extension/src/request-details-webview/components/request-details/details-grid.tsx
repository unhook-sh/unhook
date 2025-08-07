import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@unhook/ui/collapsible';
import { Icons } from '@unhook/ui/custom/icons';

export interface DetailsGridProps {
  data: RequestTypeWithEventType;
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function DetailsGrid({ data, open, setOpen }: DetailsGridProps) {
  const status = data.response?.status || 0;
  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <Card className="bg-card border-border">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-card-foreground">
                Additional Details
              </CardTitle>
              {open ? (
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
                  <span className="text-muted-foreground">Method:</span>
                  <span className="text-foreground">
                    {data.event?.originRequest.method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Content Type:</span>
                  <span className="text-foreground">
                    {data.event?.originRequest.contentType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URL:</span>
                  <span className="text-foreground break-all">
                    {data.event?.originRequest.sourceUrl}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Code:</span>
                  <span className="text-foreground">{status || 'Pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="text-foreground">
                    {data.responseTimeMs || 0}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Request Size:</span>
                  <span className="text-foreground">
                    {data.event?.originRequest.size} bytes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client IP:</span>
                  <span className="text-foreground">
                    {data.event?.originRequest.clientIp}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
