import { getApi } from '@acme/api/server'
import { H1, P } from '@acme/ui/custom/typography'
import { Skeleton } from '@acme/ui/skeleton'

function MapsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from([
        'skeleton-1',
        'skeleton-2',
        'skeleton-3',
        'skeleton-4',
        'skeleton-5',
        'skeleton-6',
      ]).map((key) => (
        <div
          key={key}
          className="bg-card flex flex-col gap-4 rounded-xl border p-6 shadow-2xs"
        >
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  )
}

export default async function Page() {
  const api = await getApi()
  void api.user.all.prefetch()

  return (
    <main className="container py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <H1>Amarix</H1>
          <P className="text-muted-foreground">
            Amarix is a map gallery for the Amarix game.
          </P>
        </div>

        {/* <Suspense fallback={<MapsSkeleton />}> */}
        {/* <HydrationBoundary></HydrationBoundary> */}
        {/* </Suspense> */}
      </div>
    </main>
  )
}
