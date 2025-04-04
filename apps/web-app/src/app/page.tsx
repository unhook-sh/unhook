import { H1, P } from '@acme/ui/custom/typography';
export default async function Page() {
  return (
    <main className="container py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <H1>Tunnel</H1>
          <P className="text-muted-foreground">
            Amarix is a map gallery for the Amarix game.
          </P>
        </div>

        {/* <Suspense fallback={<MapsSkeleton />}> */}
        {/* <HydrationBoundary></HydrationBoundary> */}
        {/* </Suspense> */}
      </div>
    </main>
  );
}
