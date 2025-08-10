import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Card, CardContent } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { TimeDisplay } from '@unhook/ui/custom/time-display';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';

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

      {data.requests && data.requests.length > 0 ? (
        <div className="rounded border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resp. Code</TableHead>
                <TableHead>Resp. Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.requests.map((request, index) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-xs">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {request.timestamp ? (
                      <TimeDisplay
                        date={request.timestamp}
                        showRelative={true}
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {request.destinationName ||
                      request.destination?.name ||
                      'Unknown'}
                  </TableCell>
                  <TableCell
                    className="font-mono text-xs max-w-[320px] truncate"
                    title={request.destinationUrl || request.destination?.url}
                  >
                    {request.destinationUrl || request.destination?.url}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.status === 'completed'
                          ? 'default'
                          : request.status === 'failed'
                            ? 'destructive'
                            : 'outline'
                      }
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {request.response?.status ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {request.responseTimeMs ?? 0}ms
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
  );
}
