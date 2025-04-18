import { H1, P } from '@unhook/ui/custom/typography';
import ModernFlowDiagram from './test';
export default async function Page() {
  return (
    <main className="container py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <H1>Unhook</H1>
          <P className="text-muted-foreground">
            Unhook is a tool for building webhooks.
          </P>
        </div>
        <ModernFlowDiagram />

        {/* <Suspense fallback={<MapsSkeleton />}> */}
        {/* <HydrationBoundary></HydrationBoundary> */}
        {/* </Suspense> */}
      </div>
    </main>
  );
}
