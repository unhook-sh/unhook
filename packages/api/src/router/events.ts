import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import {
  CreateEventTypeSchema,
  Events,
  Requests,
  UpdateEventTypeSchema,
} from '@unhook/db/schema';

import { createTRPCRouter, protectedProcedure } from '../trpc';

export const eventsRouter = createTRPCRouter({
  count: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const totalCount = await ctx.db
        .select({ count: count() })
        .from(Events)
        .where(eq(Events.webhookId, input.webhookId));

      return totalCount[0]?.count ?? 0;
    }),
  all: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const events = await ctx.db
      .select()
      .from(Events)
      .where(eq(Events.orgId, ctx.auth.orgId))
      .orderBy(desc(Events.createdAt));

    return events;
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const event = await ctx.db
        .select()
        .from(Events)
        .where(and(eq(Events.id, input.id), eq(Events.orgId, ctx.auth.orgId)))
        .limit(1);

      if (!event.length) return null;

      return event[0];
    }),

  byWebhookId: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const events = await ctx.db.query.Events.findMany({
        where: and(
          eq(Events.webhookId, input.webhookId),
          eq(Events.orgId, ctx.auth.orgId),
        ),
        orderBy: [desc(Events.timestamp)],
        with: {
          requests: {
            orderBy: [desc(Requests.createdAt)],
          },
        },
      });

      return events;
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

  markCompleted: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        response: z.object({
          status: z.number(),
          headers: z.record(z.string()),
          body: z.string(),
        }),
        responseTimeMs: z.number(),
        connectionId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [request] = await ctx.db
        .update(Requests)
        .set({
          status: 'completed',
          response: input.response,
          responseTimeMs: input.responseTimeMs,
          completedAt: new Date(),
          connectionId: input.connectionId ?? undefined,
        })
        .where(eq(Requests.id, input.requestId))
        .returning();

      return request;
    }),

  markFailed: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        failedReason: z.string(),
        connectionId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [request] = await ctx.db
        .update(Requests)
        .set({
          status: 'failed',
          failedReason: input.failedReason,
          completedAt: new Date(),
          connectionId: input.connectionId ?? undefined,
        })
        .where(eq(Requests.id, input.requestId))
        .returning();

      return request;
    }),

  updateEventStatus: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        status: z.enum(['pending', 'processing', 'completed', 'failed']),
        retryCount: z.number().optional(),
        failedReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [event] = await ctx.db
        .update(Events)
        .set({
          status: input.status,
          retryCount: input.retryCount,
          failedReason: input.failedReason,
          updatedAt: new Date(),
        })
        .where(
          and(eq(Events.id, input.eventId), eq(Events.orgId, ctx.auth.orgId)),
        )
        .returning();

      return event;
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
});
