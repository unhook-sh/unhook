import { getApi, HydrationBoundary } from '@unhook/api/server';
import { Suspense } from 'react';
import { RequestView } from '~/app/(app)/app/_components/requests/request-view';

export default async function RequestsPage() {
  const api = await getApi();
  void api.webhooks.all.prefetch();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HydrationBoundary>
        <RequestView />
      </HydrationBoundary>
    </Suspense>
  );
}
