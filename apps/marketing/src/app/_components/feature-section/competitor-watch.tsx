"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import type { ChartConfig } from "@acme/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@acme/ui/chart";

const chartData = [
  {
    competitorA: 50,
    competitorB: 20,
    criteria: "Market Presence",
    startup: 80,
  },
  { competitorA: 25, competitorB: 50, criteria: "Innovation", startup: 85 },
  {
    competitorA: 25,
    competitorB: 50,
    criteria: "Customer Satisfaction",
    startup: 90,
  },
  { competitorA: 65, competitorB: 70, criteria: "Pricing", startup: 75 },
  {
    competitorA: 20,
    competitorB: 45,
    criteria: "Product Quality",
    startup: 95,
  },
];

const chartConfig = {
  competitorA: {
    color: "hsl(var(--chart-2))",
    label: "Competitor A",
  },
  competitorB: {
    color: "hsl(var(--chart-3))",
    label: "Competitor B",
  },
  startup: {
    color: "hsl(var(--chart-1))",
    label: "Startup",
  },
} satisfies ChartConfig;

export function CompetitorWatch() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Competitor Analysis</CardTitle>
        <CardDescription>Evaluation against your competitors</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto max-h-[250px]">
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarGrid gridType="circle" />
            <PolarAngleAxis dataKey="criteria" />
            <Radar
              dataKey="startup"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.6}
              dot={{
                fillOpacity: 1,
                r: 4,
              }}
            />
            <Radar
              dataKey="competitorA"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.6}
              dot={{
                fillOpacity: 1,
                r: 4,
              }}
            />
            <Radar
              dataKey="competitorB"
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.6}
              dot={{
                fillOpacity: 1,
                r: 4,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
