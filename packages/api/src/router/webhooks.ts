import {
  ApiKeys,
  CreateWebhookTypeSchema,
  UpdateWebhookTypeSchema,
  Webhooks,
} from '@unhook/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const webhooksRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const webhooks = await ctx.db
      .select()
      .from(Webhooks)
      .where(eq(Webhooks.orgId, ctx.auth.orgId))
      .orderBy(desc(Webhooks.updatedAt));

    return webhooks;
  }),
  authorized: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const webhook = await ctx.db.query.Webhooks.findFirst({
        where: and(
          eq(Webhooks.orgId, ctx.auth.orgId),
          eq(Webhooks.id, input.id),
        ),
      });

      return !!webhook;
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

      const apiKey = input.apiKeyId
        ? await ctx.db.query.ApiKeys.findFirst({
            where: and(
              eq(ApiKeys.key, input.apiKeyId),
              eq(ApiKeys.orgId, ctx.auth.orgId),
            ),
          })
        : await ctx.db.query.ApiKeys.findFirst({
            where: and(eq(ApiKeys.orgId, ctx.auth.orgId)),
          });

      if (!apiKey) throw new Error('API key not found');

      const [webhook] = await ctx.db
        .insert(Webhooks)
        .values({
          ...input,
          apiKeyId: apiKey.id,
          orgId: ctx.auth.orgId,
          userId: ctx.auth.userId,
        })
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
        updateLastRequest: z.boolean().optional(),
        webhookId: z.string(),
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
            eq(Webhooks.id, input.webhookId),
            eq(Webhooks.orgId, ctx.auth.orgId),
          ),
        )
        .returning();

      return webhook;
    }),
  usage: protectedProcedure
    // .input(
    //   z.object({
    //     period: z.enum(['day', 'month']).optional().default('month'),
    //   }),
    // )
    .query(async ({ ctx }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      // const org = await ctx.db.query.Orgs.findFirst({
      //   where: eq(Orgs.id, ctx.auth.orgId),
      // });

      // if (!org || !org.stripeSubscriptionId) {
      //   return 0;
      // }

      // const subscription = (await stripe.subscriptions.retrieve(
      //   org.stripeSubscriptionId,
      //   {
      //     expand: ['latest_invoice'],
      //   },
      // )) as Stripe.Subscription;

      // // Get events since the current period start
      // const currentPeriodStart = new Date(
      //   (subscription.items.data[0]?.current_period_start ??
      //     Date.now() / 1000) * 1000,
      // );

      // const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const webhooks = await ctx.db.query.Webhooks.findMany({
        where: and(eq(Webhooks.orgId, ctx.auth.orgId)),
      });

      return webhooks.length;
    }),
});
