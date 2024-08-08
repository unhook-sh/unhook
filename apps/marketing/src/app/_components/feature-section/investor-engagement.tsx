"use client";

import { Activity, Calendar, Mail } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

const engagementData = [
  {
    activity: "Email Sent",
    count: 120,
    icon: <Mail className="h-6 w-6 text-blue-500" />,
  },
  {
    activity: "Meetings Scheduled",
    count: 15,
    icon: <Calendar className="h-6 w-6 text-green-500" />,
  },
  {
    activity: "Follow-ups",
    count: 30,
    icon: <Activity className="h-6 w-6 text-yellow-500" />,
  },
];

const metricsData = {
  openRate: "75%",
  responseRate: "60%",
};

export function InvestorEngagement() {
  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Automated Investor Engagement</CardTitle>
        <CardDescription>
          Overview of recent investor engagement activities
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {engagementData.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-lg bg-gray-800 p-4"
            >
              {item.icon}
              <div>
                <div className="text-lg font-bold">{item.count}</div>
                <div className="text-sm text-gray-400">{item.activity}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          <span>Open Rate:</span>
          <span className="text-blue-500">{metricsData.openRate}</span>
        </div>
        <div className="flex items-center gap-2 font-medium leading-none">
          <span>Response Rate:</span>
          <span className="text-green-500">{metricsData.responseRate}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
