import { kv } from '@vercel/kv';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { Tunnels } from '@unhook/db/schema';

import { createTRPCRouter, protectedProcedure } from '../trpc';

export const tunnelsRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    // console.log('ctx.auth', ctx.auth);
    // if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const tunnels = await ctx.db
      .select()
      .from(Tunnels)
      // .where(eq(Tunnels.orgId, ctx.auth.orgId))
      .orderBy(desc(Tunnels.updatedAt));

    return tunnels;
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const tunnel = await ctx.db
        .select()
        .from(Tunnels)
        .where(and(eq(Tunnels.id, input.id), eq(Tunnels.orgId, ctx.auth.orgId)))
        .limit(1);

      if (!tunnel.length) return null;

      const [firstTunnel] = tunnel;
      if (!firstTunnel) return null;

      const isConnected = await kv.hexists(
        'tunnel:clients',
        `${firstTunnel.id}:${firstTunnel.clientId}`,
      );

      return {
        ...firstTunnel,
        isConnected,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        port: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!ctx.auth.userId) throw new Error('User ID is required');

      const [tunnel] = await ctx.db
        .insert(Tunnels)
        .values({
          clientId: input.clientId,
          port: input.port,
          status: 'active',
          orgId: ctx.auth.orgId,
          userId: ctx.auth.userId,
        })
        .returning();

      // Add API key to valid keys set
      await kv.sadd('tunnel:ids', tunnel?.id);

      return tunnel;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [tunnel] = await ctx.db
        .delete(Tunnels)
        .where(and(eq(Tunnels.id, input.id), eq(Tunnels.orgId, ctx.auth.orgId)))
        .returning();

      if (tunnel) {
        // Remove API key from valid keys set
        await kv.srem('tunnel:id', tunnel.id);
      }

      return tunnel;
    }),
});
