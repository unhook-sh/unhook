import 'server-only';

import {
  dehydrate,
  HydrationBoundary as ReactQueryHydrationBoundary,
} from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { getApi } from './server';

export async function HydrationBoundary(props: PropsWithChildren) {
  const api = await getApi();
  const dehydratedState = dehydrate(api.queryClient);

  return (
    <ReactQueryHydrationBoundary state={dehydratedState}>
      {props.children}
    </ReactQueryHydrationBoundary>
  );
}
