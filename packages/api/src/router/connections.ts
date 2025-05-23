import { kv } from '@vercel/kv';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import {
  Connections,
  CreateConnectionTypeSchema,
  UpdateConnectionTypeSchema,
} from '@unhook/db/schema';

import { createTRPCRouter, protectedProcedure } from '../trpc';

export const connectionsRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const connections = await ctx.db
      .select()
      .from(Connections)
      .where(eq(Connections.orgId, ctx.auth.orgId))
      .orderBy(desc(Connections.connectedAt));

    return connections;
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const connection = await ctx.db
        .select()
        .from(Connections)
        .where(
          and(
            eq(Connections.id, input.id),
            eq(Connections.orgId, ctx.auth.orgId),
          ),
        )
        .limit(1);

      if (!connection.length) return null;

      const [firstConnection] = connection;
      if (!firstConnection) return null;

      const isConnected = await kv.hexists(
        'webhook:clients',
        `${firstConnection.clientId}`,
      );

      return {
        ...firstConnection,
        isConnected,
      };
    }),

  byWebhookId: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const connections = await ctx.db
        .select()
        .from(Connections)
        .where(
          and(
            eq(Connections.webhookId, input.webhookId),
            eq(Connections.orgId, ctx.auth.orgId),
          ),
        )
        .orderBy(desc(Connections.connectedAt));

      return connections;
    }),

  create: protectedProcedure
    .input(CreateConnectionTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [connection] = await ctx.db
        .insert(Connections)
        .values({
          ...input,
          orgId: ctx.auth.orgId,
          userId: ctx.auth.userId,
        })
        .returning();

      return connection;
    }),

  update: protectedProcedure
    .input(UpdateConnectionTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!input.id) throw new Error('Connection ID is required');

      const [connection] = await ctx.db
        .update(Connections)
        .set(input)
        .where(eq(Connections.id, input.id))
        .returning();

      return connection;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [connection] = await ctx.db
        .delete(Connections)
        .where(
          and(
            eq(Connections.id, input.id),
            eq(Connections.orgId, ctx.auth.orgId),
          ),
        )
        .returning();

      return connection;
    }),
});
