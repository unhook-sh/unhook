import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import {
  CreateWebhookTypeSchema,
  UpdateWebhookTypeSchema,
  Webhooks,
} from '@unhook/db/schema';

import { createTRPCRouter, protectedProcedure } from '../trpc';

export const webhooksRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    // console.log('ctx.auth', ctx.auth);
    // if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const webhooks = await ctx.db
      .select()
      .from(Webhooks)
      // .where(eq(Webhooks.orgId, ctx.auth.orgId))
      .orderBy(desc(Webhooks.updatedAt));

    return webhooks;
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const webhook = await ctx.db.query.Webhooks.findFirst({
        where: and(
          eq(Webhooks.id, input.id),
          eq(Webhooks.orgId, ctx.auth.orgId),
        ),
      });

      if (!webhook) return null;

      return webhook;
    }),

  create: protectedProcedure
    .input(CreateWebhookTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!ctx.auth.userId) throw new Error('User ID is required');

      const [webhook] = await ctx.db
        .insert(Webhooks)
        .values({
          ...input,
          orgId: ctx.auth.orgId,
          userId: ctx.auth.userId,
        })
        .returning();

      return webhook;
    }),

  update: protectedProcedure
    .input(UpdateWebhookTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!input.id) throw new Error('Webhook ID is required');

      const [webhook] = await ctx.db
        .update(Webhooks)
        .set(input)
        .where(
          and(eq(Webhooks.id, input.id), eq(Webhooks.orgId, ctx.auth.orgId)),
        )
        .returning();

      return webhook;
    }),

  updateStats: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        updateLastRequest: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [webhook] = await ctx.db
        .update(Webhooks)
        .set({
          ...(input.updateLastRequest ? { lastRequestAt: new Date() } : {}),
          requestCount: sql`${Webhooks.requestCount} + 1`,
        })
        .where(
          and(
            eq(Webhooks.clientId, input.webhookId),
            eq(Webhooks.orgId, ctx.auth.orgId),
          ),
        )
        .returning();

      return webhook;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [webhook] = await ctx.db
        .delete(Webhooks)
        .where(
          and(eq(Webhooks.id, input.id), eq(Webhooks.orgId, ctx.auth.orgId)),
        )
        .returning();

      return webhook;
    }),
});
