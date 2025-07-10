'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface WebhookActivityChartProps {
  timeRange: string;
}

export function WebhookActivityChart({ timeRange }: WebhookActivityChartProps) {
  const [data, setData] = useState<{ time: string; invocations: number }[]>([]);

  const getTimeRangeInMs = useCallback((range: string) => {
    switch (range) {
      case '1h':
        return 60 * 60 * 1000;
      case '12h':
        return 12 * 60 * 60 * 1000;
      case '24h':
        return 24 * 60 * 60 * 1000;
      case '7d':
        return 7 * 24 * 60 * 60 * 1000;
      default:
        return 12 * 60 * 60 * 1000;
    }
  }, []);

  useEffect(() => {
    // Generate mock data based on time range
    const generateData = () => {
      const points =
        timeRange === '1h'
          ? 12
          : timeRange === '12h'
            ? 24
            : timeRange === '24h'
              ? 24
              : 48;

      const now = new Date();
      const data = [];

      for (let i = points; i >= 0; i--) {
        const time = new Date(
          now.getTime() - i * (getTimeRangeInMs(timeRange) / points),
        );
        const hour = time.getHours().toString().padStart(2, '0');
        const minute = time.getMinutes().toString().padStart(2, '0');

        data.push({
          invocations: Math.floor(Math.random() * 10),
          time: `${hour}:${minute}`,
        });
      }

      return data;
    };

    setData(generateData());
  }, [timeRange, getTimeRangeInMs]);

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart
          data={data}
          margin={{ bottom: 5, left: 0, right: 10, top: 5 }}
        >
          <XAxis
            axisLine={false}
            dataKey="time"
            fontSize={12}
            minTickGap={30}
            stroke="#888888"
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            fontSize={12}
            stroke="#888888"
            tickFormatter={(value) => `${value}`}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Time
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {payload[0]?.payload?.time}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Invocations
                        </span>
                        <span className="font-bold">{payload[0]?.value}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            activeDot={{ r: 4, strokeWidth: 0 }}
            dataKey="invocations"
            dot={false}
            stroke="#f59e0b"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
