import { kv } from '@vercel/kv';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { Connections } from '@acme/db/schema';

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
        'tunnel:clients',
        `${firstConnection.clientId}`,
      );

      return {
        ...firstConnection,
        isConnected,
      };
    }),

  byTunnelId: protectedProcedure
    .input(z.object({ tunnelId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const connections = await ctx.db
        .select()
        .from(Connections)
        .where(
          and(
            eq(Connections.tunnelId, input.tunnelId),
            eq(Connections.orgId, ctx.auth.orgId),
          ),
        )
        .orderBy(desc(Connections.connectedAt));

      return connections;
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
