import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@unhook/ui/collapsible';
import { Icons } from '@unhook/ui/custom/icons';

export interface EventHeadersProps {
  data: EventTypeWithRequest;
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function EventHeaders({ data, open, setOpen }: EventHeadersProps) {
  return (
    <Collapsible onOpenChange={setOpen} open={open}>
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
                  {Object.keys(data.originRequest?.headers ?? {}).length}
                </Badge>
                {open ? (
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
            {Object.keys(data.originRequest?.headers ?? {}).length > 0 ? (
              <div className="bg-muted/50 rounded-lg p-3 max-h-64 overflow-auto">
                <div className="space-y-1">
                  {Object.entries(data.originRequest?.headers ?? {}).map(
                    ([key, value]) => (
                      <div className="flex text-xs font-mono" key={key}>
                        <span className="text-primary w-32 flex-shrink-0 font-medium">
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
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No headers available
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
