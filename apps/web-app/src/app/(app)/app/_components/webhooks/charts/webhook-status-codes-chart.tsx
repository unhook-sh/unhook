'use client';

import { ChartContainer } from '@unhook/ui/chart';
import { type JSX, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import type { ActiveShape } from 'recharts/types/util/types';

const statusData = [
  { color: '#10b981', name: '200 OK', value: 65 },
  { color: '#22c55e', name: '201 Created', value: 10 },
  { color: '#4ade80', name: '204 No Content', value: 5 },
  { color: '#f59e0b', name: '400 Bad Request', value: 8 },
  { color: '#f97316', name: '401 Unauthorized', value: 5 },
  { color: '#ef4444', name: '404 Not Found', value: 4 },
  { color: '#b91c1c', name: '500 Server Error', value: 3 },
];

const renderActiveShape = (props: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: { name: string; value: number };
  percent: number;
  value: number;
}): JSX.Element => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text
        className="text-xs font-medium"
        dy={8}
        fill={fill}
        textAnchor="middle"
        x={cx}
        y={cy}
      >
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        endAngle={endAngle}
        fill={fill}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
      />
      <Sector
        cx={cx}
        cy={cy}
        endAngle={endAngle}
        fill={fill}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        fill="none"
        stroke={fill}
      />
      <circle cx={ex} cy={ey} fill={fill} r={2} stroke="none" />
      <text
        className="text-xs"
        fill="hsl(var(--muted-foreground))"
        textAnchor={textAnchor}
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
      >{`${value} requests`}</text>
      <text
        className="text-xs"
        dy={18}
        fill="hsl(var(--muted-foreground))"
        textAnchor={textAnchor}
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
      >
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

export function WebhookStatusCodesChart() {
  const [_activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        config={{
          label: {
            color: 'hsl(var(--primary))',
            label: 'Status Codes',
          },
        }}
      >
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              // activeIndex={activeIndex}
              activeShape={renderActiveShape as ActiveShape<PieSectorDataItem>}
              cx="50%"
              cy="50%"
              data={statusData}
              dataKey="value"
              fill="#8884d8"
              innerRadius={60}
              onMouseEnter={onPieEnter}
              outerRadius={80}
            >
              {statusData.map((entry) => (
                <Cell fill={entry.color} key={entry.name} />
              ))}
            </Pie>
            <Legend
              align="center"
              formatter={(value) => <span className="text-xs">{value}</span>}
              layout="horizontal"
              verticalAlign="bottom"
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
