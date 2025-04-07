import type { TRPCRouterRecord } from '@trpc/server';
import { z } from 'zod';

import { eq } from '@acme/db';
import { CreateUserSchema, Users } from '@acme/db/schema';

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
  delete: publicProcedure.input(z.string()).mutation(({ input, ctx }) => {
    return ctx.db.delete(Users).where(eq(Users.id, input));
  }),
} satisfies TRPCRouterRecord;
