'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@acme/ui/components/chart';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

interface TunnelConnectionsChartProps {
  timeRange: string;
}

export function TunnelConnectionsChart({
  timeRange,
}: TunnelConnectionsChartProps) {
  const [data, setData] = useState<{ time: string; connections: number }[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Generate initial data based on time range
  useEffect(() => {
    const generateData = () => {
      const points = getPointsForTimeRange(timeRange);
      const now = new Date();
      const data = [];

      for (let i = points; i >= 0; i--) {
        const time = new Date(
          now.getTime() - i * (getTimeRangeInMs(timeRange) / points),
        );
        const hour = time.getHours().toString().padStart(2, '0');
        const minute = time.getMinutes().toString().padStart(2, '0');

        // Generate a somewhat realistic pattern with some randomness
        let connections = Math.floor(Math.random() * 10) + 5;

        // Add some patterns - more connections during business hours
        const hourNum = Number.parseInt(hour);
        if (hourNum >= 9 && hourNum <= 17) {
          connections += 10;
        }

        // Add occasional spikes
        if (Math.random() > 0.9) {
          connections += Math.floor(Math.random() * 15);
        }

        data.push({
          time: `${hour}:${minute}`,
          connections,
        });
      }

      return data;
    };

    setData(generateData());
  }, [timeRange]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData];

        // Remove oldest data point
        newData.shift();

        // Add new data point
        const lastTime = newData[newData.length - 1]?.time;
        const [hour, minute] = lastTime?.split(':').map(Number) ?? [];

        let newMinute = minute ?? 0 + 1;
        let newHour = hour ?? 0;

        if (newMinute >= 60) {
          newMinute = 0;
          newHour = (newHour ?? 0 + 1) % 24;
        }

        const newTimeStr = `${newHour?.toString().padStart(2, '0')}:${newMinute?.toString().padStart(2, '0')}`;

        // Calculate new connections value with some continuity from the last value
        const lastConnections = newData[newData.length - 1]?.connections ?? 0;
        let newConnections =
          lastConnections +
          (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3);

        // Ensure connections don't go below 0
        newConnections = Math.max(0, newConnections);

        newData.push({
          time: newTimeStr,
          connections: newConnections,
        });

        return newData;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  const getTimeRangeInMs = (range: string) => {
    switch (range) {
      case '1h':
        return 60 * 60 * 1000;
      case '6h':
        return 6 * 60 * 60 * 1000;
      case '24h':
        return 24 * 60 * 60 * 1000;
      case '7d':
        return 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  };

  const getPointsForTimeRange = (range: string) => {
    switch (range) {
      case '1h':
        return 60;
      case '6h':
        return 72;
      case '24h':
        return 96;
      case '7d':
        return 84;
      case '30d':
        return 90;
      default:
        return 96;
    }
  };

  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        config={{
          connections: {
            label: 'Active Connections',
            color: 'hsl(var(--chart-1))',
          },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorConnections" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-connections)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-connections)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="connections"
              stroke="var(--color-connections)"
              fillOpacity={1}
              fill="url(#colorConnections)"
              strokeWidth={2}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="mt-2 flex items-center justify-end">
        <button
          onClick={() => setIsLive(!isLive)}
          className={`text-xs ${isLive ? 'text-green-500' : 'text-muted-foreground'} flex items-center gap-1`}
        >
          <span
            className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-muted-foreground'}`}
          />
          {isLive ? 'Live Updates' : 'Paused'}
        </button>
      </div>
    </div>
  );
}
