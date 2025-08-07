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

export interface TechnicalDetailsProps {
  data: EventTypeWithRequest;
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function TechnicalDetails({
  data,
  open,
  setOpen,
}: TechnicalDetailsProps) {
  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <Card className="shadow-sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Icons.Settings className="h-4 w-4" />
                Technical Details
              </CardTitle>
              {open ? (
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
                <span className="text-muted-foreground">HTTP Method:</span>
                <Badge className="text-xs font-mono" variant="outline">
                  {data.originRequest?.method || 'N/A'}
                </Badge>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Content Type:</span>
                <span
                  className="text-xs font-mono max-w-32 truncate"
                  title={data.originRequest?.contentType}
                >
                  {data.originRequest?.contentType || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Request Size:</span>
                <span className="font-mono text-xs">
                  {data.originRequest?.size
                    ? `${data.originRequest.size} bytes`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Client IP:</span>
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
  );
}
