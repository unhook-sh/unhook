import type { QueryClient } from '@tanstack/react-query'
import {
  HydrationBoundary as ReactQueryHydrationBoundary,
  dehydrate,
} from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

export function HydrationBoundary(
  props: PropsWithChildren<{ queryClient: QueryClient }>,
) {
  const dehydratedState = dehydrate(props.queryClient)

  return (
    <ReactQueryHydrationBoundary state={dehydratedState}>
      {props.children}
    </ReactQueryHydrationBoundary>
  )
}
