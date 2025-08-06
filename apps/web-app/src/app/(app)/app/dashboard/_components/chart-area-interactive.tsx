'use client';

import { api } from '@unhook/api/react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { type ChartConfig, ChartContainer } from '@unhook/ui/chart';
import { useIsMobile } from '@unhook/ui/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@unhook/ui/toggle-group';
import { format, subDays } from 'date-fns';
import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

export const description = 'An interactive area chart showing webhook events';

const chartConfig = {
  completed: {
    color: 'var(--primary)',
    label: 'Completed',
  },
  events: {
    label: 'Events',
  },
  failed: {
    color: 'var(--destructive)',
    label: 'Failed',
  },
  pending: {
    color: 'var(--warning)',
    label: 'Pending',
  },
  processing: {
    color: 'var(--secondary)',
    label: 'Processing',
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('90d');

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('7d');
    }
  }, [isMobile]);

  // Fetch all events from the database
  const { data: events = [], isLoading } = api.events.all.useQuery({});

  // Transform events data for the chart
  const chartData = React.useMemo(() => {
    if (!events.length) return [];

    // Calculate the start date based on time range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      default:
        startDate = subDays(now, 90);
        break;
    }

    // Filter events within the time range
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate;
    });

    // Group events by date and status
    const groupedData = new Map<
      string,
      {
        date: string;
        completed: number;
        failed: number;
        pending: number;
        processing: number;
      }
    >();

    // Initialize all dates in the range
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      groupedData.set(dateKey, {
        completed: 0,
        date: dateKey,
        failed: 0,
        pending: 0,
        processing: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count events by date and status
    filteredEvents.forEach((event) => {
      const dateKey = format(new Date(event.timestamp), 'yyyy-MM-dd');
      const existing = groupedData.get(dateKey);
      if (existing) {
        switch (event.status) {
          case 'completed':
            existing.completed++;
            break;
          case 'failed':
            existing.failed++;
            break;
          case 'pending':
            existing.pending++;
            break;
          case 'processing':
            existing.processing++;
            break;
        }
      }
    });

    // Convert to array and sort by date
    return Array.from(groupedData.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [events, timeRange]);

  const getTimeRangeDescription = () => {
    switch (timeRange) {
      case '7d':
        return 'Last 7 days';
      case '30d':
        return 'Last 30 days';
      case '90d':
        return 'Last 3 months';
    }
  };

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
          <CardDescription>Loading events data...</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="aspect-auto h-[250px] w-full animate-pulse bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Webhook Events</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {getTimeRangeDescription()}
          </span>
          <span className="@[540px]/card:hidden">
            {getTimeRangeDescription()}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            onValueChange={setTimeRange}
            type="single"
            value={timeRange}
            variant="outline"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select onValueChange={setTimeRange} value={timeRange}>
            <SelectTrigger
              aria-label="Select a value"
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem className="rounded-lg" value="90d">
                Last 3 months
              </SelectItem>
              <SelectItem className="rounded-lg" value="30d">
                Last 30 days
              </SelectItem>
              <SelectItem className="rounded-lg" value="7d">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          className="aspect-auto h-[250px] w-full"
          config={chartConfig}
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillCompleted" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-completed)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-completed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillFailed" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-failed)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-failed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillPending" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-pending)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-pending)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillProcessing" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-processing)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-processing)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return format(date, 'MMM dd');
              }}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis axisLine={false} tickLine={false} tickMargin={8} />
            <Area
              dataKey="completed"
              fill="url(#fillCompleted)"
              stackId="a"
              stroke="var(--color-completed)"
              type="natural"
            />
            <Area
              dataKey="processing"
              fill="url(#fillProcessing)"
              stackId="a"
              stroke="var(--color-processing)"
              type="natural"
            />
            <Area
              dataKey="pending"
              fill="url(#fillPending)"
              stackId="a"
              stroke="var(--color-pending)"
              type="natural"
            />
            <Area
              dataKey="failed"
              fill="url(#fillFailed)"
              stackId="a"
              stroke="var(--color-failed)"
              type="natural"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
