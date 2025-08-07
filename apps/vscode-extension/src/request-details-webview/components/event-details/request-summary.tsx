import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { Separator } from '@unhook/ui/separator';

export interface RequestSummaryProps {
  data: EventTypeWithRequest;
}

export function RequestSummary({ data }: RequestSummaryProps) {
  const requestCount = data.requests?.length || 0;
  return (
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
              {data.requests?.filter((r) => r.status === 'completed').length ||
                0}
            </div>
            <div className="text-xs text-primary font-medium">Successful</div>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg">
            <div className="text-2xl font-bold text-destructive">
              {data.requests?.filter((r) => r.status === 'failed').length || 0}
            </div>
            <div className="text-xs text-destructive font-medium">Failed</div>
          </div>
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Requests:</span>
            <span className="font-medium">{requestCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Success Rate:</span>
            <span className="font-medium">
              {requestCount > 0
                ? Math.round(
                    ((data.requests?.filter((r) => r.status === 'completed')
                      .length || 0) /
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
  );
}
