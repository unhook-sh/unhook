import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Card, CardContent } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { RequestCard } from './request-card';

export interface ForwardedRequestsProps {
  data: EventTypeWithRequest;
}

export function ForwardedRequests({ data }: ForwardedRequestsProps) {
  const requestCount = data.requests?.length || 0;
  return (
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
  );
}
