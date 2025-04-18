import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { Requests } from '@unhook/db/schema';

import { createTRPCRouter, protectedProcedure } from '../trpc';

export const requestsRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    // if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const requests = await ctx.db
      .select()
      .from(Requests)
      // .where(eq(Requests.orgId, ctx.auth.orgId))
      .orderBy(desc(Requests.createdAt));

    return requests;
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const request = await ctx.db
        .select()
        .from(Requests)
        .where(
          and(eq(Requests.id, input.id), eq(Requests.orgId, ctx.auth.orgId)),
        )
        .limit(1);

      if (!request.length) return null;

      return request[0];
    }),

  byTunnelId: protectedProcedure
    .input(z.object({ tunnelId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const requests = await ctx.db
        .select()
        .from(Requests)
        .where(
          and(
            eq(Requests.tunnelId, input.tunnelId),
            eq(Requests.orgId, ctx.auth.orgId),
          ),
        )
        .orderBy(desc(Requests.createdAt));

      return requests;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [request] = await ctx.db
        .delete(Requests)
        .where(
          and(eq(Requests.id, input.id), eq(Requests.orgId, ctx.auth.orgId)),
        )
        .returning();

      return request;
    }),
});
