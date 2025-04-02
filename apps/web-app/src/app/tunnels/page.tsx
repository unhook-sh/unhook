import { getApi } from '@acme/api/server'
import { Button } from '@acme/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@acme/ui/card'
import { Icons } from '@acme/ui/custom/icons'
import { H1, P } from '@acme/ui/custom/typography'
import { Skeleton } from '@acme/ui/skeleton'
import { Suspense } from 'react'

import { CreateTunnelDialog } from './create-tunnel-dialog'
import { TunnelsList } from './tunnels-list'

function TunnelsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {['1', '2', '3', '4', '5', '6'].map((key) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-3/4" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-full" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="mt-4 h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function TunnelsPage() {
  const api = await getApi()
  await api.tunnels.all.prefetch()

  return (
    <main className="container py-16">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <H1>Tunnels</H1>
            <P className="text-muted-foreground">
              Manage your secure tunnels to expose local services.
            </P>
          </div>
          <CreateTunnelDialog>
            <Button>
              <Icons.Plus size="sm" className="mr-2" />
              Create Tunnel
            </Button>
          </CreateTunnelDialog>
        </div>

        <Suspense fallback={<TunnelsSkeleton />}>
          <TunnelsList />
        </Suspense>
      </div>
    </main>
  )
}
