import { kv } from '@vercel/kv';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import {
  CreateTunnelTypeSchema,
  Tunnels,
  UpdateTunnelTypeSchema,
} from '@unhook/db/schema';

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

      const tunnel = await ctx.db.query.Tunnels.findFirst({
        where: and(eq(Tunnels.id, input.id), eq(Tunnels.orgId, ctx.auth.orgId)),
      });

      if (!tunnel) return null;

      return tunnel;
    }),

  create: protectedProcedure
    .input(CreateTunnelTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!ctx.auth.userId) throw new Error('User ID is required');

      const [tunnel] = await ctx.db
        .insert(Tunnels)
        .values({
          ...input,
          orgId: ctx.auth.orgId,
          userId: ctx.auth.userId,
        })
        .returning();

      // Add API key to valid keys set
      await kv.sadd('tunnel:ids', tunnel?.id);

      return tunnel;
    }),

  update: protectedProcedure
    .input(UpdateTunnelTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!input.id) throw new Error('Tunnel ID is required');

      const [tunnel] = await ctx.db
        .update(Tunnels)
        .set(input)
        .where(and(eq(Tunnels.id, input.id), eq(Tunnels.orgId, ctx.auth.orgId)))
        .returning();

      return tunnel;
    }),

  updateStats: protectedProcedure
    .input(
      z.object({
        tunnelId: z.string(),
        updateLastRequest: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [tunnel] = await ctx.db
        .update(Tunnels)
        .set({
          ...(input.updateLastRequest ? { lastRequestAt: new Date() } : {}),
          requestCount: sql`${Tunnels.requestCount} + 1`,
        })
        .where(
          and(
            eq(Tunnels.clientId, input.tunnelId),
            eq(Tunnels.orgId, ctx.auth.orgId),
          ),
        )
        .returning();

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
