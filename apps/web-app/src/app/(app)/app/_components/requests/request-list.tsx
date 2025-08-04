'use client';

import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { cn } from '@unhook/ui/lib/utils';
import { Skeleton } from '@unhook/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface RequestListProps {
  requests: RequestTypeWithEventType[];
  isLoading: boolean;
  onSelectRequest: (request: RequestTypeWithEventType) => void;
  selectedRequestId?: string;
}

export function RequestList({
  requests,
  isLoading,
  onSelectRequest,
  selectedRequestId,
}: RequestListProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="sticky top-0 z-10 grid grid-cols-5 gap-4 border-b bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
        <div>Time</div>
        <div>Status</div>
        <div>Host</div>
        <div>Request</div>
        <div>Messages</div>
      </div>

      <div className="divide-y">
        {isLoading ? (
          [
            'request-skeleton-1',
            'request-skeleton-2',
            'request-skeleton-3',
            'request-skeleton-4',
            'request-skeleton-5',
          ].map((index) => <RequestRowSkeleton key={`skeleton-${index}`} />)
        ) : requests.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No logs found
          </div>
        ) : (
          requests.map((request) => (
            <RequestRow
              isSelected={request.id === selectedRequestId}
              key={request.id}
              onClick={() => onSelectRequest(request)}
              request={request}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface RequestRowProps {
  request: RequestTypeWithEventType;
  onClick: () => void;
  isSelected: boolean;
}

function RequestRow({ request, onClick, isSelected }: RequestRowProps) {
  return (
    <div
      className={cn(
        'grid cursor-pointer grid-cols-5 gap-4 px-4 py-2 text-sm hover:bg-muted/50',
        isSelected && 'bg-muted',
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-2">
        {(request.response?.status ?? 0) >= 400 && (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
        {(request.response?.status ?? 0) >= 500 && (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        )}
        <span className="font-mono">{request.createdAt.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          className="font-mono"
          variant={
            (request.response?.status ?? 0) >= 400 ? 'destructive' : 'outline'
          }
        >
          {request.event?.originRequest?.method} {request.response?.status}
        </Badge>
      </div>
      <div className="truncate font-mono">{request.destination.name}</div>
      <div className="truncate font-mono">
        {request.event?.originRequest?.method}
      </div>
      <div className="truncate">{request.destination.name}</div>
    </div>
  );
}

function RequestRowSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-4 px-4 py-2">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
    </div>
  );
}
