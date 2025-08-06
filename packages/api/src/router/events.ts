import {
  CreateEventTypeSchema,
  Events,
  type EventTypeWithRequest,
  Orgs,
  Requests,
  UpdateEventTypeSchema,
} from '@unhook/db/schema';
import { stripe } from '@unhook/stripe';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import type Stripe from 'stripe';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const eventsRouter = createTRPCRouter({
  all: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const events = await ctx.db.query.Events.findMany({
        limit: input.limit ?? 50,
        offset: input.offset ?? 0,
        orderBy: [desc(Events.createdAt)],
        where: eq(Events.orgId, ctx.auth.orgId),
      });

      return events;
    }),
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const event = await ctx.db.query.Events.findFirst({
        where: and(eq(Events.id, input.id), eq(Events.orgId, ctx.auth.orgId)),
      });

      return event;
    }),

  byIdWithRequests: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const event = await ctx.db.query.Events.findFirst({
        orderBy: [desc(Events.timestamp)],
        where: and(eq(Events.id, input.id), eq(Events.orgId, ctx.auth.orgId)),
        with: {
          requests: {
            orderBy: [desc(Requests.createdAt)],
          },
        },
      });

      return event || null;
    }),

  byWebhookId: protectedProcedure
    .input(
      z.object({
        lastEventTime: z.string().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        webhookId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const whereConditions = [
        eq(Events.webhookId, input.webhookId),
        eq(Events.orgId, ctx.auth.orgId),
      ];

      if (input.lastEventTime) {
        whereConditions.push(
          gte(Events.createdAt, new Date(input.lastEventTime)),
        );
      }

      const events = await ctx.db.query.Events.findMany({
        limit: input.limit ?? 50,
        offset: input.offset ?? 0,
        orderBy: [desc(Events.createdAt)],
        where: and(...whereConditions),
        with: {
          requests: {
            orderBy: [desc(Requests.createdAt)],
          },
        },
      });
      console.log('events', {
        events: events.length,
        lastEventTime: input.lastEventTime,
        orgId: ctx.auth.orgId,
        webhookId: input.webhookId,
      });

      return events satisfies EventTypeWithRequest[];
    }),

  count: protectedProcedure
    .input(z.object({ webhookId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      const whereConditions = [eq(Events.orgId, ctx.auth.orgId)];

      if (input.webhookId) {
        whereConditions.push(eq(Events.webhookId, input.webhookId));
      }

      const totalCount = await ctx.db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(Events)
        .where(and(...whereConditions));

      return totalCount[0]?.count ?? 0;
    }),

  create: protectedProcedure
    .input(CreateEventTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!ctx.auth.userId) throw new Error('User ID is required');

      const [request] = await ctx.db
        .insert(Events)
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

      const [event] = await ctx.db
        .delete(Events)
        .where(and(eq(Events.id, input.id), eq(Events.orgId, ctx.auth.orgId)))
        .returning();

      return event;
    }),

  update: protectedProcedure
    .input(UpdateEventTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!input.id) throw new Error('Event ID is required');

      const [event] = await ctx.db
        .update(Events)
        .set(input)
        .where(and(eq(Events.id, input.id), eq(Events.orgId, ctx.auth.orgId)))
        .returning();

      return event;
    }),

  updateEventStatus: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        failedReason: z.string().optional(),
        retryCount: z.number().optional(),
        status: z.enum(['pending', 'processing', 'completed', 'failed']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [event] = await ctx.db
        .update(Events)
        .set({
          failedReason: input.failedReason,
          retryCount: input.retryCount,
          status: input.status,
          updatedAt: new Date(),
        })
        .where(
          and(eq(Events.id, input.eventId), eq(Events.orgId, ctx.auth.orgId)),
        )
        .returning();

      return event;
    }),
  usage: protectedProcedure
    .input(
      z.object({
        period: z.enum(['day', 'month']).optional().default('month'),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      const org = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.id, ctx.auth.orgId),
      });

      if (!org || !org.stripeSubscriptionId) {
        return null;
      }

      const subscription = (await stripe.subscriptions.retrieve(
        org.stripeSubscriptionId,
        {
          expand: ['latest_invoice'],
        },
      )) as Stripe.Subscription;

      // Get events since the current period start
      const currentPeriodStart = new Date(
        (subscription.items.data[0]?.current_period_start ??
          Date.now() / 1000) * 1000,
      );

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      let events = await ctx.db.query.Events.findMany({
        where: and(
          eq(Events.orgId, ctx.auth.orgId),
          gte(
            Events.createdAt,
            input.period === 'day' ? oneDayAgo : currentPeriodStart,
          ),
        ),
      });

      // If there is only one event, we need to filter out the example event
      if (events.length === 1) {
        events = events.filter((event) => event.source !== 'unhook_example');
      }

      return events.length;
    }),
});
