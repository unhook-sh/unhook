import {
  CreateRequestTypeSchema,
  Requests,
  type RequestType,
} from '@unhook/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

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

  byEventIdAndDestination: protectedProcedure
    .input(
      z.object({
        destinationName: z.string(),
        destinationUrl: z.string(),
        eventId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const requests = await ctx.db
        .select()
        .from(Requests)
        .where(
          and(
            eq(Requests.eventId, input.eventId),
            eq(Requests.orgId, ctx.auth.orgId),
            eq(Requests.destinationName, input.destinationName),
            eq(Requests.destinationUrl, input.destinationUrl),
          ),
        )
        .limit(1);

      return requests[0] || null;
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

      if (!request) throw new Error('Failed to create request');

      return request satisfies RequestType;
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

  markCompleted: protectedProcedure
    .input(
      z.object({
        connectionId: z.string().optional(),
        requestId: z.string(),
        response: z.object({
          body: z.string(),
          headers: z.record(z.string()),
          status: z.number(),
        }),
        responseTimeMs: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [request] = await ctx.db
        .update(Requests)
        .set({
          completedAt: new Date(),
          connectionId: input.connectionId ?? undefined,
          response: input.response,
          responseTimeMs: input.responseTimeMs,
          status: 'completed',
        })
        .where(eq(Requests.id, input.requestId))
        .returning();

      return request;
    }),

  markFailed: protectedProcedure
    .input(
      z.object({
        connectionId: z.string().optional(),
        failedReason: z.string(),
        requestId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [request] = await ctx.db
        .update(Requests)
        .set({
          completedAt: new Date(),
          connectionId: input.connectionId ?? undefined,
          failedReason: input.failedReason,
          status: 'failed',
        })
        .where(eq(Requests.id, input.requestId))
        .returning();

      return request;
    }),
});
