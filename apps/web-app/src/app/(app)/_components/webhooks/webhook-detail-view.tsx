'use client';

import { Badge } from '@unhook/ui/components/badge';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@unhook/ui/components/dropdown-menu';
import { Input } from '@unhook/ui/components/input';
import { Skeleton } from '@unhook/ui/components/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@unhook/ui/components/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unhook/ui/components/tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  MoreVertical,
  Play,
  Search,
  Settings,
  Square,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DeleteWebhookDialog } from '~/app/(app)/_components/webhooks/delete-webhook-dialog';
import { WebhookActivityChart } from '~/app/(app)/_components/webhooks/webhook-activity-chart';
import { WebhookAnalyticsDashboard } from '~/app/(app)/_components/webhooks/webhook-analytics-dashboard';
import { WebhookErrorRateChart } from '~/app/(app)/_components/webhooks/webhook-error-rate-chart';
import { WebhookMetrics } from '~/app/(app)/_components/webhooks/webhook-metrics';
import { WebhookRequestsTable } from '~/app/(app)/_components/webhooks/webhook-requests-table';
import { useWebhook } from '~/hooks/use-webhook';

interface WebhookDetailViewProps {
  id: string;
}

export function WebhookDetailView({ id }: WebhookDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('12h');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { webhook, isLoading, startWebhook, stopWebhook, deleteWebhook } =
    useWebhook(id);

  const handleBack = () => {
    router.push('/webhooks');
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const handleDelete = async () => {
    await deleteWebhook();
    setShowDeleteDialog(false);
    router.push('/webhooks');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col bg-background text-foreground">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-[300px] rounded-lg" />
              <Skeleton className="h-[300px] rounded-lg" />
            </div>
            <Skeleton className="h-[100px] rounded-lg" />
            <Skeleton className="h-[400px] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <h1 className="text-2xl font-bold">Webhook not found</h1>
        <p className="text-muted-foreground">
          The webhook you are looking for does not exist or has been deleted.
        </p>
        <Button className="mt-4" onClick={handleBack}>
          Back to Webhooks
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">{webhook.id}</h1>
          <Badge
            variant={webhook.status === 'active' ? 'default' : 'secondary'}
            className={
              webhook.status === 'active'
                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-500'
                : ''
            }
          >
            {webhook.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border bg-background p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setTimeRange('1h')}
              data-active={timeRange === '1h'}
            >
              1h
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setTimeRange('12h')}
              data-active={timeRange === '12h'}
            >
              12h
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setTimeRange('24h')}
              data-active={timeRange === '24h'}
            >
              24h
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setTimeRange('7d')}
              data-active={timeRange === '7d'}
            >
              7d
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {webhook.status === 'active' ? (
                <DropdownMenuItem onClick={() => stopWebhook()}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop Webhook
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => startWebhook()}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Webhook
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => router.push(`/webhooks/${id}/settings`)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Webhook Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Webhook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 overflow-hidden"
      >
        <div className="border-b bg-background">
          <div className="flex items-center px-4">
            <TabsList className="h-12">
              <TabsTrigger
                value="overview"
                className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Requests
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="overview" className="m-0 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Invocations
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold">
                    {webhook.metrics?.invocations || 0}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WebhookActivityChart timeRange={timeRange} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Error Rate
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold">
                    {webhook.metrics?.errorRate || 0}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WebhookErrorRateChart timeRange={timeRange} />
                </CardContent>
              </Card>
            </div>

            <WebhookMetrics webhook={webhook} />

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Webhook Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Webhook ID
                    </h3>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-1 py-0.5 text-sm">
                        {webhook.id}
                      </code>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyUrl(webhook.id)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy ID</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Local Port
                    </h3>
                    <p className="text-sm">{webhook.localPort}</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      HTTP Delivery URL
                    </h3>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-1 py-0.5 text-sm truncate max-w-[250px]">
                        {webhook.deliveredAddress}
                      </code>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                handleCopyUrl(webhook.deliveredAddress)
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy URL</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                window.open(webhook.deliveredAddress, '_blank')
                              }
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Open URL</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      HTTPS Delivery URL
                    </h3>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-1 py-0.5 text-sm truncate max-w-[250px]">
                        {webhook.deliveredAddress.replace(
                          'http://',
                          'https://',
                        )}
                      </code>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                handleCopyUrl(
                                  webhook.deliveredAddress.replace(
                                    'http://',
                                    'https://',
                                  ),
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy URL</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                window.open(
                                  webhook.deliveredAddress.replace(
                                    'http://',
                                    'https://',
                                  ),
                                  '_blank',
                                )
                              }
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Open URL</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Created
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        {format(new Date(webhook.createdAt), 'MMM d, yyyy')}
                      </span>
                      <Clock className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        {format(new Date(webhook.createdAt), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(webhook.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Last Activity
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(webhook.lastActivity || webhook.createdAt),
                          'MMM d, yyyy',
                        )}
                      </span>
                      <Clock className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(webhook.lastActivity || webhook.createdAt),
                          'h:mm a',
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(webhook.lastActivity || webhook.createdAt),
                        { addSuffix: true },
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Recent Requests
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('requests')}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <WebhookRequestsTable webhookId={id} limit={5} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="m-0">
            <WebhookAnalyticsDashboard webhookId={id} />
          </TabsContent>

          <TabsContent value="requests" className="m-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Request Logs</h2>
              <div className="relative w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search requests..."
                  className="pl-8"
                />
              </div>
            </div>
            <Card className="bg-black border-zinc-800 text-white overflow-hidden">
              <CardContent className="p-0">
                <WebhookRequestsTable webhookId={id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="m-0 space-y-4">
            <h2 className="text-lg font-semibold">Webhook Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general settings for your webhook.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Local Port</h3>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={webhook.localPort}
                      className="max-w-[200px]"
                    />
                    <Button>Update</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The local port your service is running on.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Destructive actions that cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
                  <div>
                    <h3 className="font-medium">Delete Webhook</h3>
                    <p className="text-sm text-muted-foreground">
                      This will permanently delete the webhook and all
                      associated data.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <DeleteWebhookDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        webhook={webhook}
        onConfirm={handleDelete}
      />
    </div>
  );
}
