import { cache } from "react";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";

import { appRouter, createTRPCContext } from "@acme/api";

import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  const request = new NextRequest("https://notused.com", {
    headers: heads,
  });

  return createTRPCContext(request);
});

export const api = createServerSideHelpers({
  ctx: await createContext(),
  queryClient: createQueryClient(),
  router: appRouter,
  transformer: superjson,
});
