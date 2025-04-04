"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface TunnelActivityChartProps {
  timeRange: string
}

export function TunnelActivityChart({ timeRange }: TunnelActivityChartProps) {
  const [data, setData] = useState<{ time: string; invocations: number }[]>([])

  useEffect(() => {
    // Generate mock data based on time range
    const generateData = () => {
      const points = timeRange === "1h" ? 12 : timeRange === "12h" ? 24 : timeRange === "24h" ? 24 : 48

      const now = new Date()
      const data = []

      for (let i = points; i >= 0; i--) {
        const time = new Date(now.getTime() - i * (getTimeRangeInMs(timeRange) / points))
        const hour = time.getHours().toString().padStart(2, "0")
        const minute = time.getMinutes().toString().padStart(2, "0")

        data.push({
          time: `${hour}:${minute}`,
          invocations: Math.floor(Math.random() * 10),
        })
      }

      return data
    }

    setData(generateData())
  }, [timeRange])

  const getTimeRangeInMs = (range: string) => {
    switch (range) {
      case "1h":
        return 60 * 60 * 1000
      case "12h":
        return 12 * 60 * 60 * 1000
      case "24h":
        return 24 * 60 * 60 * 1000
      case "7d":
        return 7 * 24 * 60 * 60 * 1000
      default:
        return 12 * 60 * 60 * 1000
    }
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Time</span>
                        <span className="font-bold text-muted-foreground">{payload[0].payload.time}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Invocations</span>
                        <span className="font-bold">{payload[0].value}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="invocations"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

