'use client';

import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import { extractEventName } from '@unhook/client/utils/extract-event-name';
import { getSourceDisplayText } from '@unhook/client/utils/source-display';
import { Badge } from '@unhook/ui/badge';
import { TimezoneDisplay } from '@unhook/ui/custom/timezone-display';
import { Skeleton } from '@unhook/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@unhook/ui/tooltip';
import { Eye, Play } from 'lucide-react';
import posthog from 'posthog-js';

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-8 w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[150px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[120px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[80px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="size-8 rounded" />
      </TableCell>
    </TableRow>
  );
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'processing':
      return 'secondary';
    case 'pending':
      return 'outline';
    default:
      return 'outline';
  }
}

export function RecentEventsTable() {
  const events = api.events.all.useQuery({
    limit: 50,
    offset: 0,
  });

  const handleViewEvent = (eventId: string) => {
    // Track the event view action
    posthog.capture('dashboard_event_view_clicked', {
      event_id: eventId,
      source: 'recent_events_table',
    });
    // Navigate to the events page with the specific event
    window.location.href = `/app/events?eventId=${eventId}`;
  };

  const handleReplayEvent = (eventId: string) => {
    // Track the event replay action
    posthog.capture('dashboard_event_replay_clicked', {
      event_id: eventId,
      source: 'recent_events_table',
    });
    // TODO: Implement event replay functionality
    console.log('Replay event:', eventId);
  };

  const handleViewAllEvents = () => {
    window.location.href = '/app/events';
  };

  return (
    <div className="rounded border">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold">Recent Events</h3>
          <p className="text-sm text-muted-foreground">
            Latest 50 webhook events from your organization
          </p>
        </div>
        <MetricButton
          metric="dashboard_view_all_events_clicked"
          onClick={handleViewAllEvents}
          size="sm"
          variant="outline"
        >
          View All Events
        </MetricButton>
      </div>
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.isLoading
            ? // Show skeleton rows while loading
              [
                'skeleton-1',
                'skeleton-2',
                'skeleton-3',
                'skeleton-4',
                'skeleton-5',
              ].map((key) => <SkeletonRow key={key} />)
            : // Show actual data when loaded
              events.data?.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-sm">
                    <TimezoneDisplay date={event.timestamp} />
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate">
                          {extractEventName(event.originRequest.body) ||
                            'Unknown Event'}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {extractEventName(event.originRequest.body) ||
                          'Unknown Event'}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm text-muted-foreground">
                      {getSourceDisplayText(event)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="font-mono" variant="outline">
                      {event.originRequest.method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(event.status)}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <MetricButton
                            className="h-8 w-8 p-0"
                            metric="recent_events_table_view_event_clicked"
                            onClick={() => handleViewEvent(event.id)}
                            size="sm"
                            variant="ghost"
                          >
                            <Eye className="size-4" />
                          </MetricButton>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <MetricButton
                            className="h-8 w-8 p-0"
                            metric="recent_events_table_replay_event_clicked"
                            onClick={() => handleReplayEvent(event.id)}
                            size="sm"
                            variant="ghost"
                          >
                            <Play className="size-4" />
                          </MetricButton>
                        </TooltipTrigger>
                        <TooltipContent>Replay Event</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          {!events.isLoading && (!events.data || events.data.length === 0) && (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={6}>
                No events found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
