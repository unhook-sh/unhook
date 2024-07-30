import { headers } from "next/headers";
import { getAuth } from "@clerk/nextjs/server";
import * as trpcNext from "@trpc/server/adapters/next";

import { db } from "@acme/db/client";

export const createTRPCContext = async (
  opts: trpcNext.CreateNextContextOptions,
  h: typeof headers,
) => {
  return { auth: getAuth(opts.req), db };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
