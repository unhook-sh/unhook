'use client';

import { ChartContainer } from '@unhook/ui/chart';
import { useCallback, useEffect, useState } from 'react';
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

interface WebhookLatencyChartProps {
  timeRange: string;
  detailed?: boolean;
}

export function WebhookLatencyChart({
  timeRange,
  detailed = false,
}: WebhookLatencyChartProps) {
  const [data, setData] = useState<
    {
      time: string;
      avgLatency: number;
      p95Latency?: number;
      p99Latency?: number;
    }[]
  >([]);

  const getTimeRangeInMs = useCallback((range: string) => {
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
  }, []);

  const getPointsForTimeRange = useCallback((range: string) => {
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
  }, []);

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
        const hourNum = Number.parseInt(hour, 10);
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
          avgLatency,
          time: `${hour}:${minute}`,
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
  }, [timeRange, detailed, getPointsForTimeRange, getTimeRangeInMs]);

  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        config={{
          avgLatency: {
            color: 'hsl(var(--chart-1))',
            label: 'Avg Latency',
          },
          ...(detailed
            ? {
                p95Latency: {
                  color: 'hsl(var(--chart-2))',
                  label: 'p95 Latency',
                },
                p99Latency: {
                  color: 'hsl(var(--chart-3))',
                  label: 'p99 Latency',
                },
              }
            : {}),
        }}
      >
        <ResponsiveContainer height="100%" width="100%">
          {detailed ? (
            <LineChart
              data={data}
              margin={{ bottom: 0, left: 0, right: 10, top: 10 }}
            >
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="time"
                fontSize={12}
                minTickGap={30}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                fontSize={12}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `${value}ms`}
                tickLine={false}
              />
              {/* <ChartTooltip content={<ChartTooltipContent />} /> */}
              <Line
                activeDot={{ r: 4, strokeWidth: 0 }}
                dataKey="avgLatency"
                dot={false}
                stroke="var(--color-avgLatency)"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                activeDot={{ r: 4, strokeWidth: 0 }}
                dataKey="p95Latency"
                dot={false}
                stroke="var(--color-p95Latency)"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                activeDot={{ r: 4, strokeWidth: 0 }}
                dataKey="p99Latency"
                dot={false}
                stroke="var(--color-p99Latency)"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          ) : (
            <AreaChart
              data={data}
              margin={{ bottom: 0, left: 0, right: 10, top: 10 }}
            >
              <defs>
                <linearGradient id="colorLatency" x1="0" x2="0" y1="0" y2="1">
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
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="time"
                fontSize={12}
                minTickGap={30}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                fontSize={12}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `${value}ms`}
                tickLine={false}
              />
              {/* <ChartTooltip content={<ChartTooltipContent />} /> */}
              <Area
                activeDot={{ r: 6, strokeWidth: 0 }}
                dataKey="avgLatency"
                fill="url(#colorLatency)"
                fillOpacity={1}
                stroke="var(--color-avgLatency)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
