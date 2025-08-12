'use client';

import { MetricButton } from '@unhook/analytics/components';
import { Input } from '@unhook/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { CreateWebhookDialog } from '~/app/(app)/app/_components/webhooks/create-webhook-dialog';
import { WebhookAnalyticsDashboard } from '~/app/(app)/app/_components/webhooks/webhook-analytics-dashboard';
import { WebhookList } from '~/app/(app)/app/_components/webhooks/webhook-list';
import { useWebhooks } from '~/hooks/use-webhooks';

export function WebhookDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const {
    webhooks,
    isLoading,
    refresh,
    startWebhook,
    stopWebhook,
    deleteWebhook,
  } = useWebhooks();

  const filteredWebhooks = webhooks.filter(
    (webhook) =>
      webhook.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      webhook.deliveredAddress
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Webhooks</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search webhooks..."
              type="search"
              value={searchQuery}
            />
          </div>
          <MetricButton
            metric="webhook_dashboard_create_clicked"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Webhook
          </MetricButton>
        </div>
      </header>

      <Tabs className="flex-1 overflow-hidden" defaultValue="webhooks">
        <div className="border-b bg-background">
          <div className="flex items-center px-4">
            <TabsList className="h-12">
              <TabsTrigger
                className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                value="webhooks"
              >
                Webhooks
              </TabsTrigger>
              <TabsTrigger
                className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                value="analytics"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent className="mt-0 h-full" value="webhooks">
            <div className="rounded-lg border bg-card h-full">
              <WebhookList
                isLoading={isLoading}
                onDelete={deleteWebhook}
                onStart={startWebhook}
                onStop={stopWebhook}
                webhooks={filteredWebhooks}
              />
            </div>
          </TabsContent>
          <TabsContent className="mt-0 h-full" value="analytics">
            <WebhookAnalyticsDashboard />
          </TabsContent>
        </div>
      </Tabs>

      <CreateWebhookDialog
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refresh}
        open={isCreateDialogOpen}
      />
    </div>
  );
}
