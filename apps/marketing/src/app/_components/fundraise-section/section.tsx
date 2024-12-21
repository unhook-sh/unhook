"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
} from "recharts";

import type { ChartConfig } from "@acme/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@acme/ui/chart";
import { Icons } from "@acme/ui/icons";
import { cn } from "@acme/ui/lib/utils";
import { ShinyButton } from "@acme/ui/magicui/shiny-button";
import { Text } from "@acme/ui/typography";

const chartData = [
  { month: "January", raised: 80, target: 186 },
  { month: "February", raised: 200, target: 305 },
  { month: "March", raised: 120, target: 237 },
  { month: "April", raised: 190, target: 73 },
  { month: "May", raised: 130, target: 209 },
  { month: "June", raised: 140, target: 214 },
];

const chartConfig = {
  raised: {
    color: "hsl(var(--chart-2))",
    label: "Raised",
  },
  target: {
    color: "hsl(var(--chart-1))",
    label: "Target",
  },
} satisfies ChartConfig;

const chartData2 = [
  { browser: "safari", fill: "var(--color-safari)", visitors: 1_500_000 },
];

const chartConfig2 = {
  safari: {
    color: "hsl(var(--chart-2))",
    label: "Safari",
  },
  visitors: {
    label: "Visitors",
  },
} satisfies ChartConfig;

export function FundraiseSection() {
  const financialNumberFormatter = new Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: "compact",
    style: "currency",
  });

  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  // useEffect(() => {
  //   if (inView) {
  //     controls.start({
  //       opacity: 1,
  //       transition: { delay: Math.random() * 2, duration: 1, ease: "easeOut" },
  //     });
  //   }
  // }, [controls, inView]);
  //   const listVariants = {
  //   offScreen: {
  //     opacity: 0,
  //     x: 24,
  //   },
  //   onScreen: {
  //     opacity: 1,
  //     transition: {
  //       duration: 0.8,
  //     },
  //     x: 0,
  //   },
  // } satisfies Variants;
  return (
    <section
      id="features"
      className="mx-auto flex max-w-screen-xl flex-col justify-center gap-8 px-4 md:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-5xl font-bold tracking-tight text-black dark:text-white sm:text-6xl">
          Track your raise
        </h2>
        <p className="mt-6 text-xl leading-8 text-black/80 dark:text-white">
          Let AI help you raise funds faster. Track your round, fix risks, and
          get insights on your fundraising journey.
        </p>
      </div>
      <div className="mx-auto flex flex-col gap-8 lg:flex-row" ref={ref}>
        {/* <RaiseGraphFeature /> */}
        <Card>
          <CardHeader>
            <CardTitle>Seed Round</CardTitle>
            <CardDescription>
              Showing total amount raised in the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inView && (
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="raised"
                    type="natural"
                    fill="var(--color-raised)"
                    fillOpacity={0.4}
                    stroke="var(--color-raised)"
                    stackId="a"
                  />
                  <Area
                    dataKey="target"
                    type="natural"
                    fill="var(--color-target)"
                    fillOpacity={0.4}
                    stroke="var(--color-target)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 font-medium leading-none">
                  Trending up by 5.2% this month{" "}
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  January - June {new Date().getFullYear()}
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Raise Tracker</CardTitle>
            <CardDescription>
              January - June {new Date().getFullYear()}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            {inView && (
              <ChartContainer
                config={chartConfig2}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RadialBarChart
                  data={chartData2}
                  endAngle={100}
                  innerRadius={80}
                  outerRadius={140}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    className="first:fill-muted last:fill-background"
                    polarRadius={[86, 74]}
                  />
                  <RadialBar dataKey="visitors" background />
                  <PolarRadiusAxis
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-4xl font-bold"
                              >
                                {financialNumberFormatter.format(
                                  chartData2[0]?.visitors ?? 0,
                                )}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Raised
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing total money raised for the last 6 months
            </div>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Risks</CardTitle>
            <CardDescription>
              Fix the risks before they become a problem
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4 flex-1">
            <ul className="flex flex-col gap-4">
              <li
                className={cn("flex gap-2 border p-4 opacity-0", {
                  "animate-fade-in transition-all [--animation-delay:100ms] [--duration:2s]":
                    inView,
                })}
              >
                <Icons.AlertTriangle variant={"destructive"} />
                <Text>Waiting for funds from 2 investors.</Text>
              </li>
              <li
                className={cn("flex gap-2 border p-4 opacity-0", {
                  "animate-fade-in transition-all [--animation-delay:300ms] [--duration:2s]":
                    inView,
                })}
              >
                <Icons.AlertTriangle variant={"destructive"} />
                <Text>1 required signature.</Text>
              </li>
              <li
                className={cn("flex gap-2 border p-4 opacity-0", {
                  "animate-fade-in transition-all [--animation-delay:600ms] [--duration:2s]":
                    inView,
                })}
              >
                <Icons.AlertTriangle variant={"destructive"} />
                <Text>SAFE Document out of date.</Text>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <ShinyButton text="Fix Risks" />
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
