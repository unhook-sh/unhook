import { cache } from "react";
import { headers } from "next/headers";

import { createCaller, createTRPCContext } from "@acme/api";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const nextHeaders = await headers();
  const heads = new Headers(nextHeaders);
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

export const api2 = createCaller(createContext);
