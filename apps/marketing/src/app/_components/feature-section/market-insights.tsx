"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

const marketTrendsData = [
  { month: "January", value: 400 },
  { month: "February", value: 300 },
  { month: "March", value: 500 },
  { month: "April", value: 200 },
  { month: "May", value: 300 },
  { month: "June", value: 400 },
];

const kpisData = {
  growthRate: "5.2%",
  marketShare: "15%",
  customerSatisfaction: "85%",
};

export function MarketInsights() {
  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>AI-Driven Market Insights</CardTitle>
        <CardDescription>
          Real-time market insights and trends analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={marketTrendsData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          <span>Growth Rate:</span>
          <span className="text-blue-500">{kpisData.growthRate}</span>
        </div>
        <div className="flex items-center gap-2 font-medium leading-none">
          <span>Market Share:</span>
          <span className="text-green-500">{kpisData.marketShare}</span>
        </div>
        <div className="flex items-center gap-2 font-medium leading-none">
          <span>Customer Satisfaction:</span>
          <span className="text-yellow-500">
            {kpisData.customerSatisfaction}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
