'use client';

import { Calendar, Clock, Download, Filter } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@unhook/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@unhook/ui/components/dropdown-menu';
import { Tabs, TabsContent } from '@unhook/ui/components/tabs';
import { WebhookConnectionsChart } from '~/app/(app)/_components/webhooks/charts/webhook-connections-chart';
import { WebhookLatencyChart } from '~/app/(app)/_components/webhooks/charts/webhook-latency-chart';
import { WebhookRequestsDistributionChart } from '~/app/(app)/_components/webhooks/charts/webhook-requests-distribution-chart';
import { WebhookStatusCodesChart } from '~/app/(app)/_components/webhooks/charts/webhook-status-codes-chart';
import { WebhookTopPathsChart } from '~/app/(app)/_components/webhooks/charts/webhook-top-paths-chart';

interface WebhookAnalyticsDashboardProps {
  webhookId?: string;
}

export function WebhookAnalyticsDashboard({
  webhookId,
}: WebhookAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');

  const handleExportData = () => {
    // In a real app, this would generate and download a CSV or JSON file
    alert('Data export functionality would be implemented here');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            {webhookId
              ? `Performance metrics and insights for webhook ${webhookId.substring(0, 8)}...`
              : 'Overview of all webhook performance and usage patterns'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{timeRange}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimeRange('1h')}>
                Last hour
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('6h')}>
                Last 6 hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('24h')}>
                Last 24 hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('7d')}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('30d')}>
                Last 30 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={handleExportData}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 px-2 text-xs ${activeTab === 'overview' ? 'bg-muted' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 px-2 text-xs ${activeTab === 'performance' ? 'bg-muted' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 px-2 text-xs ${activeTab === 'usage' ? 'bg-muted' : ''}`}
              onClick={() => setActiveTab('usage')}
            >
              Usage
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Requests
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <title>Total Requests</title>
                  <path d="M12 2v20M2 12h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,345</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last {timeRange}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Latency
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127ms</div>
                <p className="text-xs text-muted-foreground">
                  -4.5% from last {timeRange}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Error Rate
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <title>Error Rate</title>
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">
                  +0.3% from last {timeRange}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Webhooks
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <title>Active Webhooks</title>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last {timeRange}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Active Connections</CardTitle>
                <CardDescription>
                  Real-time view of active connections over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <WebhookConnectionsChart timeRange={timeRange} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Status Codes</CardTitle>
                <CardDescription>
                  Distribution of HTTP status codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WebhookStatusCodesChart />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Request Distribution</CardTitle>
                <CardDescription>
                  Requests by forwarding address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WebhookRequestsDistributionChart />
              </CardContent>
            </Card>
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Request Latency</CardTitle>
                <CardDescription>
                  Average response time in milliseconds
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <WebhookLatencyChart timeRange={timeRange} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Requested Paths</CardTitle>
              <CardDescription>
                Most frequently accessed endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WebhookTopPathsChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Latency Over Time</CardTitle>
              <CardDescription>
                Detailed view of request processing times
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <WebhookLatencyChart timeRange={timeRange} detailed />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Request Distribution</CardTitle>
              <CardDescription>
                Detailed breakdown of requests by webhook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WebhookRequestsDistributionChart detailed />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
