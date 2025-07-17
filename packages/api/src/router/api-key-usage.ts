import { ApiKeyUsage, CreateApiKeyUsageSchema } from '@unhook/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const apiKeyUsageRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const apiKeyUsage = await ctx.db
      .select()
      .from(ApiKeyUsage)
      .where(eq(ApiKeyUsage.orgId, ctx.auth.orgId))
      .orderBy(desc(ApiKeyUsage.createdAt));

    return apiKeyUsage;
  }),

  byApiKeyId: protectedProcedure
    .input(z.object({ apiKeyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const usage = await ctx.db
        .select()
        .from(ApiKeyUsage)
        .where(
          and(
            eq(ApiKeyUsage.apiKeyId, input.apiKeyId),
            eq(ApiKeyUsage.orgId, ctx.auth.orgId),
          ),
        )
        .orderBy(desc(ApiKeyUsage.createdAt));

      return usage;
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const usage = await ctx.db.query.ApiKeyUsage.findFirst({
        where: and(
          eq(ApiKeyUsage.id, input.id),
          eq(ApiKeyUsage.orgId, ctx.auth.orgId),
        ),
      });

      if (!usage) return null;

      return usage;
    }),

  byType: protectedProcedure
    .input(
      z.object({
        type: z.enum(['webhook-event', 'mcp-server', 'webhook-event-request']),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const usage = await ctx.db
        .select()
        .from(ApiKeyUsage)
        .where(
          and(
            eq(ApiKeyUsage.type, input.type),
            eq(ApiKeyUsage.orgId, ctx.auth.orgId),
          ),
        )
        .orderBy(desc(ApiKeyUsage.createdAt));

      return usage;
    }),

  create: protectedProcedure
    .input(CreateApiKeyUsageSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!ctx.auth.userId) throw new Error('User ID is required');

      try {
        const [usage] = await ctx.db
          .insert(ApiKeyUsage)
          .values({
            ...input,
            orgId: ctx.auth.orgId,
            userId: ctx.auth.userId,
          })
          .returning();

        return usage;
      } catch (error) {
        console.error(error);
        throw new Error('Failed to create API key usage record');
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [usage] = await ctx.db
        .delete(ApiKeyUsage)
        .where(
          and(
            eq(ApiKeyUsage.id, input.id),
            eq(ApiKeyUsage.orgId, ctx.auth.orgId),
          ),
        )
        .returning();

      return usage;
    }),

  // Get recent usage
  recent: protectedProcedure
    .input(
      z.object({
        apiKeyId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        type: z
          .enum(['webhook-event', 'mcp-server', 'webhook-event-request'])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const { limit, apiKeyId, type } = input;

      const conditions = [eq(ApiKeyUsage.orgId, ctx.auth.orgId)];

      if (apiKeyId) {
        conditions.push(eq(ApiKeyUsage.apiKeyId, apiKeyId));
      }

      if (type) {
        conditions.push(eq(ApiKeyUsage.type, type));
      }

      const recent = await ctx.db
        .select()
        .from(ApiKeyUsage)
        .where(and(...conditions))
        .orderBy(desc(ApiKeyUsage.createdAt))
        .limit(limit);

      return recent;
    }),

  // Get usage statistics
  stats: protectedProcedure
    .input(
      z.object({
        apiKeyId: z.string().optional(),
        days: z.number().min(1).max(365).default(30),
        type: z
          .enum(['webhook-event', 'mcp-server', 'webhook-event-request'])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const { apiKeyId, type, days } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conditions = [
        eq(ApiKeyUsage.orgId, ctx.auth.orgId),
        sql`${ApiKeyUsage.createdAt} >= ${startDate}`,
      ];

      if (apiKeyId) {
        conditions.push(eq(ApiKeyUsage.apiKeyId, apiKeyId));
      }

      if (type) {
        conditions.push(eq(ApiKeyUsage.type, type));
      }

      const stats = await ctx.db
        .select({
          count: sql<number>`count(*)`,
          type: ApiKeyUsage.type,
        })
        .from(ApiKeyUsage)
        .where(and(...conditions))
        .groupBy(ApiKeyUsage.type);

      return stats;
    }),
});
