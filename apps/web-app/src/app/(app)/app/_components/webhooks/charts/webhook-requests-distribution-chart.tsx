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

interface WebhookRequestsDistributionChartProps {
  detailed?: boolean;
}

export function WebhookRequestsDistributionChart({
  detailed = false,
}: WebhookRequestsDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = detailed
    ? [
        { name: 'webhook-1a2b3c.example.com', requests: 423 },
        { name: 'webhook-4d5e6f.example.com', requests: 326 },
        { name: 'webhook-7g8h9i.example.com', requests: 512 },
        { name: 'webhook-0j1k2l.example.com', requests: 239 },
        { name: 'webhook-3m4n5o.example.com', requests: 178 },
        { name: 'webhook-6p7q8r.example.com', requests: 392 },
        { name: 'webhook-9s0t1u.example.com', requests: 275 },
      ]
    : [
        { name: 'webhook-1a2b3c', requests: 423 },
        { name: 'webhook-4d5e6f', requests: 326 },
        { name: 'webhook-7g8h9i', requests: 512 },
        { name: 'webhook-0j1k2l', requests: 239 },
        { name: 'webhook-3m4n5o', requests: 178 },
      ];

  const handleMouseEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const getBarFill = (index: number) => {
    const baseColor = 'hsl(var(--primary))';
    const activeColor = 'hsl(var(--primary) / 0.8)';

    if (activeIndex === null) return baseColor;
    return index === activeIndex ? activeColor : 'hsl(var(--primary) / 0.3)';
  };

  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        config={{
          requests: {
            color: 'hsl(var(--primary))',
            label: 'Requests',
          },
        }}
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            data={data}
            margin={{ bottom: 40, left: 0, right: 0, top: 20 }}
            onMouseLeave={handleMouseLeave}
          >
            <CartesianGrid
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              angle={-45}
              axisLine={false}
              dataKey="name"
              fontSize={12}
              height={70}
              stroke="hsl(var(--muted-foreground))"
              textAnchor="end"
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              fontSize={12}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `${value}`}
              tickLine={false}
            />
            {/* <ChartTooltip content={<ChartTooltipContent accessibilityLayer active coordinate={} />} /> */}
            <Bar
              dataKey="requests"
              onMouseEnter={handleMouseEnter}
              radius={[4, 4, 0, 0]}
            >
              {data.map(({ name }, index) => (
                <Cell fill={getBarFill(index)} key={name} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
