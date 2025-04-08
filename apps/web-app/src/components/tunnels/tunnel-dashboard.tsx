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
import { CreateTunnelDialog } from '~/components/tunnels/create-tunnel-dialog';
import { TunnelAnalyticsDashboard } from '~/components/tunnels/tunnel-analytics-dashboard';
import { TunnelList } from '~/components/tunnels/tunnel-list';
import { useTunnels } from '~/hooks/use-tunnels';

export function TunnelDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { tunnels, isLoading, refresh, startTunnel, stopTunnel, deleteTunnel } =
    useTunnels();

  const filteredTunnels = tunnels.filter(
    (tunnel) =>
      tunnel.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tunnel.forwardingAddress
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Tunnels</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tunnels..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Tunnel
          </Button>
        </div>
      </header>

      <Tabs defaultValue="tunnels" className="flex-1 overflow-hidden">
        <div className="border-b bg-background">
          <div className="flex items-center px-4">
            <TabsList className="h-12">
              <TabsTrigger
                value="tunnels"
                className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Tunnels
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
          <TabsContent value="tunnels" className="mt-0 h-full">
            <div className="rounded-lg border bg-card h-full">
              <TunnelList
                tunnels={filteredTunnels}
                isLoading={isLoading}
                onStart={startTunnel}
                onStop={stopTunnel}
                onDelete={deleteTunnel}
              />
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="mt-0 h-full">
            <TunnelAnalyticsDashboard />
          </TabsContent>
        </div>
      </Tabs>

      <CreateTunnelDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refresh}
      />
    </div>
  );
}
