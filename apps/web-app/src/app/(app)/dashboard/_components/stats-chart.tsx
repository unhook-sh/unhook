'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { date: 'Mar', value: 300 },
  { date: 'Apr', value: 350 },
  { date: 'May', value: 200 },
  { date: 'Jun', value: 400 },
  { date: 'Jul', value: 300 },
  { date: 'Aug', value: 200 },
  { date: 'Sep', value: 450 },
  { date: 'Oct', value: 500 },
  { date: 'Nov', value: 480 },
  { date: 'Dec', value: 400 },
  { date: 'Jan', value: 350 },
  { date: 'Feb', value: 400 },
];

export function StatsChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Value
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {payload?.[0]?.value}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Date
                        </span>
                        <span className="font-bold">
                          {payload?.[0]?.payload?.date}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#ff6b00"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
