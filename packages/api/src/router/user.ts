import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { eq } from "@acme/db";
import { CreateUserSchema, User } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.User.findMany({
      limit: 10,
    });
  }),
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.User.findFirst({
        where: eq(User.id, input.id),
      });
    }),
  create: protectedProcedure
    .input(CreateUserSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(User).values(input as any);
    }),
  delete: publicProcedure.input(z.string()).mutation(({ input, ctx }) => {
    return ctx.db.delete(User).where(eq(User.id, input));
  }),
} satisfies TRPCRouterRecord;
