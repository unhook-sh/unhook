import type { QueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import {
  dehydrate,
  HydrationBoundary as ReactQueryHydrationBoundary,
} from "@tanstack/react-query";

export function HydrationBoundary(
  props: PropsWithChildren<{ queryClient: QueryClient }>,
) {
  const dehydratedState = dehydrate(props.queryClient);

  return (
    <ReactQueryHydrationBoundary state={dehydratedState}>
      {props.children}
    </ReactQueryHydrationBoundary>
  );
}
