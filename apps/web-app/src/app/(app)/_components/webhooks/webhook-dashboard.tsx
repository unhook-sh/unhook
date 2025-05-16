'use client';

import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@unhook/ui/components/button';
import { Input } from '@unhook/ui/components/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@unhook/ui/components/tabs';
import { CreateWebhookDialog } from '~/app/(app)/_components/webhooks/create-webhook-dialog';
import { WebhookAnalyticsDashboard } from '~/app/(app)/_components/webhooks/webhook-analytics-dashboard';
import { WebhookList } from '~/app/(app)/_components/webhooks/webhook-list';
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
              type="search"
              placeholder="Search webhooks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Webhook
          </Button>
        </div>
      </header>

      <Tabs defaultValue="webhooks" className="flex-1 overflow-hidden">
        <div className="border-b bg-background">
          <div className="flex items-center px-4">
            <TabsList className="h-12">
              <TabsTrigger
                value="webhooks"
                className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Webhooks
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="webhooks" className="mt-0 h-full">
            <div className="rounded-lg border bg-card h-full">
              <WebhookList
                webhooks={filteredWebhooks}
                isLoading={isLoading}
                onStart={startWebhook}
                onStop={stopWebhook}
                onDelete={deleteWebhook}
              />
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="mt-0 h-full">
            <WebhookAnalyticsDashboard />
          </TabsContent>
        </div>
      </Tabs>

      <CreateWebhookDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refresh}
      />
    </div>
  );
}
