import { kv } from '@vercel/kv'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { Tunnels } from '@acme/db/schema'

import { createTRPCRouter, protectedProcedure } from '../trpc'

export const tunnelsRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required')

    const tunnels = await ctx.db
      .select()
      .from(Tunnels)
      .where(eq(Tunnels.orgId, ctx.auth.orgId))
      .orderBy(desc(Tunnels.updatedAt))

    // Enhance with real-time status from KV
    const enhancedTunnels = await Promise.all(
      tunnels.map(async (tunnel) => {
        const isConnected = await kv.hexists(
          'tunnel:clients',
          `${tunnel.apiKey}:${tunnel.clientId}`,
        )
        return {
          ...tunnel,
          isConnected,
        }
      }),
    )

    return enhancedTunnels
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required')

      const tunnel = await ctx.db
        .select()
        .from(Tunnels)
        .where(and(eq(Tunnels.id, input.id), eq(Tunnels.orgId, ctx.auth.orgId)))
        .limit(1)

      if (!tunnel.length) return null

      const [firstTunnel] = tunnel
      if (!firstTunnel) return null

      const isConnected = await kv.hexists(
        'tunnel:clients',
        `${firstTunnel.apiKey}:${firstTunnel.clientId}`,
      )

      return {
        ...firstTunnel,
        isConnected,
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        localAddr: z.string(),
        serverAddr: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required')
      if (!ctx.auth.userId) throw new Error('User ID is required')

      const apiKey = crypto.randomUUID()

      const [tunnel] = await ctx.db
        .insert(Tunnels)
        .values({
          apiKey,
          clientId: input.clientId,
          lastSeenAt: new Date(),
          localAddr: input.localAddr,
          orgId: ctx.auth.orgId,
          serverAddr: input.serverAddr,
          userId: ctx.auth.userId,
        })
        .returning()

      // Add API key to valid keys set
      await kv.sadd('tunnel:api_keys', apiKey)

      return tunnel
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required')

      const [tunnel] = await ctx.db
        .delete(Tunnels)
        .where(and(eq(Tunnels.id, input.id), eq(Tunnels.orgId, ctx.auth.orgId)))
        .returning()

      if (tunnel) {
        // Remove API key from valid keys set
        await kv.srem('tunnel:api_keys', tunnel.apiKey)
      }

      return tunnel
    }),
})
