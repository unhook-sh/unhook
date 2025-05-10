'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@unhook/ui/components/chart';
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
            label: 'Requests',
            color: 'hsl(var(--primary))',
          },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 0, left: 0, bottom: 40 }}
            onMouseLeave={handleMouseLeave}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="requests"
              radius={[4, 4, 0, 0]}
              onMouseEnter={handleMouseEnter}
            >
              {data.map(({ name }, index) => (
                <Cell key={name} fill={getBarFill(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
