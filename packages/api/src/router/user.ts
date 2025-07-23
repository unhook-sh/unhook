import type { TRPCRouterRecord } from '@trpc/server';
import { eq } from '@unhook/db';
import { CreateUserSchema, Users } from '@unhook/db/schema';
import { z } from 'zod';

import { protectedProcedure, publicProcedure } from '../trpc';

export const userRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.Users.findMany({
      limit: 10,
    });
  }),
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.Users.findFirst({
        where: eq(Users.id, input.id),
      });
    }),
  create: protectedProcedure
    .input(CreateUserSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(Users).values({ ...input, id: crypto.randomUUID() });
    }),
  current: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.Users.findFirst({
      where: eq(Users.id, ctx.auth.userId),
    });
  }),
  delete: publicProcedure.input(z.string()).mutation(({ input, ctx }) => {
    return ctx.db.delete(Users).where(eq(Users.id, input));
  }),
} satisfies TRPCRouterRecord;
