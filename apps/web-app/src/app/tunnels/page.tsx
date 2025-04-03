import { Button } from '@acme/ui/button';
import { Icons } from '@acme/ui/custom/icons';
import { H1, P } from '@acme/ui/custom/typography';
import { Skeleton } from '@acme/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@acme/ui/tabs';
import { Suspense } from 'react';

import { HydrationBoundary, getApi } from '@acme/api/server';
import { CreateTunnelDialog } from './create-tunnel-dialog';
import { TunnelsList } from './tunnels-list';

function TunnelsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {['1', '2', '3'].map((key) => (
        <div key={key} className="flex flex-col gap-4 rounded-lg border p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function TunnelsPage() {
  const api = await getApi();
  await api.tunnels.all.prefetch();

  return (
    <main className="container py-16">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <H1>Tunnels</H1>
            <P className="text-muted-foreground">
              Manage your active and inactive tunnels
            </P>
          </div>
          <CreateTunnelDialog>
            <Button>
              <Icons.Plus size="sm" className="mr-2" />
              Create Tunnel
            </Button>
          </CreateTunnelDialog>
        </div>

        <Tabs defaultValue="tunnels">
          <TabsList>
            <TabsTrigger value="tunnels">Tunnels</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Icons.Search
              size="sm"
              variant="muted"
              className="absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="search"
              placeholder="Search tunnels..."
              className="w-full rounded-md border bg-background px-9 py-2 text-sm outline-none ring-primary/20 transition-all placeholder:text-muted-foreground focus:ring-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Icons.LayoutGrid size="sm" />
            </Button>
            <Button variant="outline" size="icon">
              <Icons.Menu size="sm" />
            </Button>
            <Button variant="outline">
              <Icons.SlidersHorizontal size="sm" className="mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Icons.ArrowUpDown size="sm" className="mr-2" />
              Sort
            </Button>
          </div>
        </div>

        <Suspense fallback={<TunnelsSkeleton />}>
          <HydrationBoundary>
            <TunnelsList />
          </HydrationBoundary>
        </Suspense>
      </div>
    </main>
  );
}
