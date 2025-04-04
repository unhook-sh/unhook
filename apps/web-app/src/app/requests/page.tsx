import { RequestView } from '~/components/requests/request-view';

import { HydrationBoundary, getApi } from '@acme/api/server';
import { Suspense } from 'react';

export default async function RequestsPage() {
  const api = await getApi();
  void api.tunnels.all.prefetch();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HydrationBoundary>
        <RequestView />
      </HydrationBoundary>
    </Suspense>
  );
}
