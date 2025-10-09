import {
  ApiKeys,
  CreateWebhookTypeSchema,
  OrgMembers,
  Orgs,
  UpdateWebhookTypeSchema,
  Webhooks,
} from '@unhook/db/schema';
import { parseWebhookUrl } from '@unhook/utils';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const webhooksRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const webhooks = await ctx.db
      .select()
      .from(Webhooks)
      .where(eq(Webhooks.orgId, ctx.auth.orgId))
      .orderBy(desc(Webhooks.updatedAt));

    return webhooks;
  }),
  authorized: protectedProcedure
    .input(
      z.object({
        url: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!input.url) return false;

      // Parse webhook URL to extract org name and webhook name
      const { orgName, webhookName } = parseWebhookUrl(input.url);

      const org = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.name, orgName),
      });
      if (!org) throw new Error('Organization not found');

      const webhook = await ctx.db.query.Webhooks.findFirst({
        where: and(
          eq(Webhooks.orgId, ctx.auth.orgId),
          eq(Webhooks.name, webhookName),
        ),
      });

      return !!webhook;
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const webhook = await ctx.db.query.Webhooks.findFirst({
        where: and(
          eq(Webhooks.id, input.id),
          eq(Webhooks.orgId, ctx.auth.orgId),
        ),
      });

      if (!webhook) return null;

      return webhook;
    }),

  byOrgAndName: protectedProcedure
    .input(
      z.object({
        orgName: z.string(),
        webhookName: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First, find the organization by name
      const org = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.name, input.orgName),
      });

      if (!org) return null;

      // Then find the webhook by name within that organization
      const webhook = await ctx.db.query.Webhooks.findFirst({
        where: and(
          eq(Webhooks.name, input.webhookName),
          eq(Webhooks.orgId, org.id),
        ),
      });

      return webhook;
    }),
  byUrl: protectedProcedure
    .input(z.object({ url: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      // Parse webhook URL to extract org name and webhook name
      const { orgName, webhookName } = parseWebhookUrl(input.url);

      const org = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.name, orgName),
      });
      if (!org) throw new Error('Organization not found');

      const webhook = await ctx.db.query.Webhooks.findFirst({
        where: and(
          eq(Webhooks.name, webhookName),
          eq(Webhooks.orgId, ctx.auth.orgId),
        ),
      });

      return webhook;
    }),

  checkAccessForUserOrgs: protectedProcedure
    .input(
      z.object({
        webhookUrl: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId) throw new Error('User ID is required');

      // Parse webhook URL to extract org name and webhook name
      const { orgName, webhookName } = parseWebhookUrl(input.webhookUrl);

      // Find the organization that owns this webhook
      const webhookOwnerOrg = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.name, orgName),
      });

      if (!webhookOwnerOrg) {
        return [];
      }

      // Get all organizations the user belongs to
      const userOrgMemberships = await ctx.db.query.OrgMembers.findMany({
        where: eq(OrgMembers.userId, ctx.auth.userId),
      });

      if (userOrgMemberships.length === 0) {
        return [];
      }

      const userOrgIds = userOrgMemberships.map((m) => m.orgId);

      // Check if any of the user's orgs have a webhook with this name
      // A user's org has "access" if it owns the webhook (org name matches and webhook exists in that org)
      const webhooksInUserOrgs = await ctx.db.query.Webhooks.findMany({
        where: and(
          eq(Webhooks.name, webhookName),
          inArray(Webhooks.orgId, userOrgIds),
        ),
      });

      // Return the org IDs that have this webhook
      return webhooksInUserOrgs.map((w) => w.orgId);
    }),

  checkAvailability: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        orgId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // For webhook names, we check global availability since webhook names should be unique across all organizations
      // This allows checking availability during onboarding when no organization exists yet

      let existingWebhook: typeof Webhooks.$inferSelect | undefined;

      if (input.orgId) {
        // If orgId is provided, check within that specific organization
        existingWebhook = await ctx.db.query.Webhooks.findFirst({
          where: and(
            eq(Webhooks.name, input.name),
            eq(Webhooks.orgId, input.orgId),
          ),
        });
      } else {
        // Check globally across all organizations
        existingWebhook = await ctx.db.query.Webhooks.findFirst({
          where: eq(Webhooks.name, input.name),
        });
      }

      return {
        available: !existingWebhook,
        message: existingWebhook
          ? `Webhook name '${input.name}' already exists${input.orgId ? ' in this organization' : ''}`
          : `Webhook name '${input.name}' is available`,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        ...CreateWebhookTypeSchema.shape,
        orgId: z.string().optional(), // Allow passing orgId for onboarding
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) throw new Error('User ID is required');

      // Use provided orgId or fall back to auth context orgId
      const orgId = input.orgId || ctx.auth.orgId;
      if (!orgId) throw new Error('Organization ID is required');

      const apiKeyWhereClause = input.apiKeyId
        ? and(eq(ApiKeys.id, input.apiKeyId), eq(ApiKeys.orgId, orgId))
        : eq(ApiKeys.orgId, orgId);

      const apiKey = await ctx.db.query.ApiKeys.findFirst({
        where: apiKeyWhereClause,
      });

      if (!apiKey) throw new Error('API key not found');

      // Check if webhook ID already exists in this organization
      if (input.id) {
        const existingWebhook = await ctx.db.query.Webhooks.findFirst({
          where: and(eq(Webhooks.id, input.id), eq(Webhooks.orgId, orgId)),
        });

        if (existingWebhook) {
          throw new Error(
            `Webhook with ID '${input.id}' already exists in this organization`,
          );
        }
      }

      const [webhook] = await ctx.db
        .insert(Webhooks)
        .values({
          ...input,
          apiKeyId: apiKey.id,
          orgId: orgId,
          userId: ctx.auth.userId,
        })
        .returning();

      return webhook;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [webhook] = await ctx.db
        .delete(Webhooks)
        .where(
          and(eq(Webhooks.id, input.id), eq(Webhooks.orgId, ctx.auth.orgId)),
        )
        .returning();

      return webhook;
    }),

  update: protectedProcedure
    .input(UpdateWebhookTypeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!input.id) throw new Error('Webhook ID is required');

      const [webhook] = await ctx.db
        .update(Webhooks)
        .set(input)
        .where(
          and(eq(Webhooks.id, input.id), eq(Webhooks.orgId, ctx.auth.orgId)),
        )
        .returning();

      return webhook;
    }),

  updateStats: protectedProcedure
    .input(
      z.object({
        updateLastRequest: z.boolean().optional(),
        webhookId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [webhook] = await ctx.db
        .update(Webhooks)
        .set({
          ...(input.updateLastRequest ? { lastRequestAt: new Date() } : {}),
          requestCount: sql`${Webhooks.requestCount} + 1`,
        })
        .where(
          and(
            eq(Webhooks.id, input.webhookId),
            eq(Webhooks.orgId, ctx.auth.orgId),
          ),
        )
        .returning();

      return webhook;
    }),
  usage: protectedProcedure
    // .input(
    //   z.object({
    //     period: z.enum(['day', 'month']).optional().default('month'),
    //   }),
    // )
    .query(async ({ ctx }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      // const org = await ctx.db.query.Orgs.findFirst({
      //   where: eq(Orgs.id, ctx.auth.orgId),
      // });

      // if (!org || !org.stripeSubscriptionId) {
      //   return 0;
      // }

      // const subscription = (await stripe.subscriptions.retrieve(
      //   org.stripeSubscriptionId,
      //   {
      //     expand: ['latest_invoice'],
      //   },
      // )) as Stripe.Subscription;

      // // Get events since the current period start
      // const currentPeriodStart = new Date(
      //   (subscription.items.data[0]?.current_period_start ??
      //     Date.now() / 1000) * 1000,
      // );

      // const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const webhooks = await ctx.db.query.Webhooks.findMany({
        where: and(eq(Webhooks.orgId, ctx.auth.orgId)),
      });

      return webhooks.length;
    }),
});
