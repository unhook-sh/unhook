import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { CreateRequestTypeSchema, Requests } from '@unhook/db/schema';

import { createTRPCRouter, protectedProcedure } from '../trpc';

export const requestsRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const requests = await ctx.db
      .select()
      .from(Requests)
      .where(eq(Requests.orgId, ctx.auth.orgId))
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

  byWebhookId: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const requests = await ctx.db
        .select()
        .from(Requests)
        .where(
          and(
            eq(Requests.webhookId, input.webhookId),
            eq(Requests.orgId, ctx.auth.orgId),
          ),
        )
        .orderBy(desc(Requests.createdAt));

      return requests;
    }),

  create: protectedProcedure
    .input(CreateRequestTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [request] = await ctx.db
        .insert(Requests)
        .values({
          ...input,
          orgId: ctx.auth.orgId,
          userId: ctx.auth.userId,
        })
        .returning();

      return request;
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
