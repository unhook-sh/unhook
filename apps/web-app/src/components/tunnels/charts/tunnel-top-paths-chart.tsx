'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@acme/ui/components/chart';
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

export function TunnelTopPathsChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = [
    { path: '/api/webhook', requests: 423, avgLatency: 127 },
    { path: '/api/users', requests: 326, avgLatency: 95 },
    { path: '/api/auth', requests: 512, avgLatency: 112 },
    { path: '/api/data', requests: 239, avgLatency: 143 },
    { path: '/api/events', requests: 178, avgLatency: 87 },
    { path: '/api/products', requests: 392, avgLatency: 105 },
    { path: '/api/orders', requests: 275, avgLatency: 118 },
  ];

  const handleMouseEnter = (_: any, index: number) => {
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
          requests: {
            label: 'Requests',
            color: 'hsl(var(--chart-1))',
          },
          avgLatency: {
            label: 'Avg Latency (ms)',
            color: 'hsl(var(--chart-2))',
          },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            onMouseLeave={handleMouseLeave}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="path"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}ms`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              yAxisId="left"
              dataKey="requests"
              radius={[4, 4, 0, 0]}
              onMouseEnter={handleMouseEnter}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getBarFill(index)} />
              ))}
            </Bar>
            <Bar
              yAxisId="right"
              dataKey="avgLatency"
              radius={[4, 4, 0, 0]}
              fill="hsl(var(--chart-2))"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
