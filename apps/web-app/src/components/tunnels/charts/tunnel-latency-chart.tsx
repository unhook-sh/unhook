'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@unhook/ui/components/chart';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

interface TunnelLatencyChartProps {
  timeRange: string;
  detailed?: boolean;
}

export function TunnelLatencyChart({
  timeRange,
  detailed = false,
}: TunnelLatencyChartProps) {
  const [data, setData] = useState<
    {
      time: string;
      avgLatency: number;
      p95Latency?: number;
      p99Latency?: number;
    }[]
  >([]);

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
        let avgLatency = Math.floor(Math.random() * 50) + 80;

        // Add some patterns - higher latency during peak hours
        const hourNum = Number.parseInt(hour);
        if (hourNum >= 9 && hourNum <= 17) {
          avgLatency += 20;
        }

        // Add occasional spikes
        if (Math.random() > 0.9) {
          avgLatency += Math.floor(Math.random() * 100);
        }

        const dataPoint: {
          time: string;
          avgLatency: number;
          p95Latency?: number;
          p99Latency?: number;
        } = {
          time: `${hour}:${minute}`,
          avgLatency,
        };

        if (detailed) {
          dataPoint.p95Latency =
            avgLatency + Math.floor(Math.random() * 50) + 30;
          dataPoint.p99Latency =
            dataPoint.p95Latency + Math.floor(Math.random() * 70) + 50;
        }

        data.push(dataPoint);
      }

      return data;
    };

    setData(generateData());
  }, [timeRange, detailed]);

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
          avgLatency: {
            label: 'Avg Latency',
            color: 'hsl(var(--chart-1))',
          },
          ...(detailed
            ? {
                p95Latency: {
                  label: 'p95 Latency',
                  color: 'hsl(var(--chart-2))',
                },
                p99Latency: {
                  label: 'p99 Latency',
                  color: 'hsl(var(--chart-3))',
                },
              }
            : {}),
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {detailed ? (
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
                tickFormatter={(value) => `${value}ms`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="avgLatency"
                stroke="var(--color-avgLatency)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="p95Latency"
                stroke="var(--color-p95Latency)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="p99Latency"
                stroke="var(--color-p99Latency)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          ) : (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-avgLatency)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-avgLatency)"
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
                tickFormatter={(value) => `${value}ms`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="avgLatency"
                stroke="var(--color-avgLatency)"
                fillOpacity={1}
                fill="url(#colorLatency)"
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
