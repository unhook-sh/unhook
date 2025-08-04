import {
  CreateRequestTypeSchema,
  Requests,
  type RequestType,
  type RequestTypeWithEventType,
} from '@unhook/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../trpc';

export const requestsRouter = createTRPCRouter({
  all: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
        .nullish(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const { limit, offset } = input ?? {
        limit: 50,
        offset: 0,
      };

      const requests = await ctx.db.query.Requests.findMany({
        limit,
        offset,
        orderBy: [desc(Requests.createdAt)],
        where: eq(Requests.orgId, ctx.auth.orgId),
      });

      return requests satisfies RequestType[];
    }),

  allWithEvents: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
        .nullish(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const { limit, offset } = input ?? {
        limit: 50,
        offset: 0,
      };

      const requests = await ctx.db.query.Requests.findMany({
        limit,
        offset,
        orderBy: [desc(Requests.createdAt)],
        where: eq(Requests.orgId, ctx.auth.orgId),
        with: { event: true },
      });

      return requests satisfies RequestTypeWithEventType[];
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

      const request = await ctx.db.query.Requests.findFirst({
        where: and(
          eq(Requests.eventId, input.eventId),
          eq(Requests.orgId, ctx.auth.orgId),
          eq(Requests.destinationName, input.destinationName),
          eq(Requests.destinationUrl, input.destinationUrl),
        ),
      });

      return request || null;
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const request = await ctx.db.query.Requests.findFirst({
        where: and(
          eq(Requests.id, input.id),
          eq(Requests.orgId, ctx.auth.orgId),
        ),
      });

      return request || null;
    }),

  byIdWithEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const request = await ctx.db.query.Requests.findFirst({
        where: and(
          eq(Requests.id, input.id),
          eq(Requests.orgId, ctx.auth.orgId),
        ),
        with: { event: true },
      });

      return request || null;
    }),

  byWebhookId: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const requests = await ctx.db.query.Requests.findMany({
        orderBy: [desc(Requests.createdAt)],
        where: and(
          eq(Requests.webhookId, input.webhookId),
          eq(Requests.orgId, ctx.auth.orgId),
        ),
      });

      return requests satisfies RequestType[];
    }),

  byWebhookIdWithEvents: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const requests = await ctx.db.query.Requests.findMany({
        orderBy: [desc(Requests.createdAt)],
        where: and(
          eq(Requests.webhookId, input.webhookId),
          eq(Requests.orgId, ctx.auth.orgId),
        ),
        with: { event: true },
      });

      return requests satisfies RequestTypeWithEventType[];
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
