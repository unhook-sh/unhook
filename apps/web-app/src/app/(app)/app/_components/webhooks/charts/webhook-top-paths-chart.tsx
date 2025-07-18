'use client';

import { ChartContainer } from '@unhook/ui/chart';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

export function WebhookTopPathsChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = [
    { avgLatency: 127, path: '/api/webhook', requests: 423 },
    { avgLatency: 95, path: '/api/users', requests: 326 },
    { avgLatency: 112, path: '/api/auth', requests: 512 },
    { avgLatency: 143, path: '/api/data', requests: 239 },
    { avgLatency: 87, path: '/api/events', requests: 178 },
    { avgLatency: 105, path: '/api/products', requests: 392 },
    { avgLatency: 118, path: '/api/orders', requests: 275 },
  ];

  const handleMouseEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const getBarFill = (index: number) => {
    const baseColor = 'hsl(var(--chart-1))';
    const activeColor = 'hsl(var(--chart-1) / 0.8)';

    if (activeIndex === null) return baseColor;
    return index === activeIndex ? activeColor : 'hsl(var(--chart-1) / 0.3)';
  };

  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        config={{
          avgLatency: {
            color: 'hsl(var(--chart-2))',
            label: 'Avg Latency (ms)',
          },
          requests: {
            color: 'hsl(var(--chart-1))',
            label: 'Requests',
          },
        }}
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            data={data}
            margin={{ bottom: 20, left: 0, right: 30, top: 20 }}
            onMouseLeave={handleMouseLeave}
          >
            <CartesianGrid
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="path"
              fontSize={12}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              fontSize={12}
              orientation="left"
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `${value}`}
              tickLine={false}
              yAxisId="left"
            />
            <YAxis
              axisLine={false}
              fontSize={12}
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `${value}ms`}
              tickLine={false}
              yAxisId="right"
            />
            {/* <ChartTooltip content={<ChartTooltipContent />} /> */}
            <Bar
              dataKey="requests"
              onMouseEnter={handleMouseEnter}
              radius={[4, 4, 0, 0]}
              yAxisId="left"
            >
              {data.map(({ path }, index) => (
                <Cell fill={getBarFill(index)} key={path} />
              ))}
            </Bar>
            <Bar
              dataKey="avgLatency"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
              yAxisId="right"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
