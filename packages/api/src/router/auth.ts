import type { TRPCRouterRecord } from "@trpc/server";

import { protectedProcedure } from "../trpc";

export const authRouter = {
  getSecretMessage: protectedProcedure.query(() => {
    return "you can see this secret message!";
  }),
} satisfies TRPCRouterRecord;
