import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@unhook/ui/collapsible';
import { Icons } from '@unhook/ui/custom/icons';

export interface HeadersSectionsProps {
  data: RequestTypeWithEventType;
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function RequestHeadersSection({
  data,
  open,
  setOpen,
}: HeadersSectionsProps) {
  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <Card className="bg-card border-border">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-card-foreground">
                Request Headers
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
            <div className="bg-muted rounded-lg p-4 border border-border">
              <div className="space-y-2">
                {Object.entries(data.event?.originRequest.headers ?? {}).map(
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
  );
}

export function ResponseHeadersSection({
  data,
  open,
  setOpen,
}: HeadersSectionsProps) {
  if (!data.response) return null;
  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <Card className="bg-card border-border">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-card-foreground">
                Response Headers
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
            <div className="bg-muted rounded-lg p-4 border border-border">
              <div className="space-y-2">
                {Object.entries(data.response.headers).map(([key, value]) => (
                  <div className="flex text-sm font-mono" key={key}>
                    <span className="text-primary w-48 flex-shrink-0">
                      {key}:
                    </span>
                    <span className="text-foreground break-all">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
