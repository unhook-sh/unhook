import {
  checkEntitySubscriptionRoles,
  checkSubscriptionClaimsRole,
  countSubscriptionsByClaimsRole,
  getRealtimeSubscriptionsByWebhookId,
} from '@unhook/db/supabase/get-realtime-record';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

export const realtimeSubscriptionsRouter = createTRPCRouter({
  checkEntitySubscriptionRoles: protectedProcedure
    .input(
      z.object({
        entity: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await checkEntitySubscriptionRoles(input.entity);
    }),

  checkSubscriptionClaimsRole: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await checkSubscriptionClaimsRole(input.subscriptionId);
    }),

  countSubscriptionsByClaimsRole: protectedProcedure.query(async () => {
    return await countSubscriptionsByClaimsRole();
  }),

  getSubscriptionsForWebhook: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const allSubscriptions = await getRealtimeSubscriptionsByWebhookId(
        input.webhookId,
      );

      if (!Array.isArray(allSubscriptions)) {
        return [];
      }

      // Filter subscriptions for the specific webhook ID
      return allSubscriptions.filter((sub) => {
        return sub.filters.includes(input.webhookId);
      });
    }),

  verifyWebhookSubscriptionClaims: publicProcedure
    .input(
      z.object({
        tableName: z.enum(['events', 'requests']),
        webhookId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const allSubscriptions = await getRealtimeSubscriptionsByWebhookId(
        input.webhookId,
      );

      if (!Array.isArray(allSubscriptions)) {
        return { claimsRole: null, found: false, isAuthenticated: false };
      }

      // Filter subscriptions for the specific webhook ID and table
      const webhookSubscriptions = allSubscriptions.filter((sub) => {
        return (
          sub.filters.includes(input.webhookId) &&
          sub.entity === input.tableName
        );
      });

      const tableSubscription = webhookSubscriptions.find(
        (sub) => sub.entity === input.tableName,
      );

      if (!tableSubscription) {
        return { claimsRole: null, found: false, isAuthenticated: false };
      }

      const claimsRole = tableSubscription.claims_role;
      const isAuthenticated =
        claimsRole === 'anon' || claimsRole === 'authenticated';

      return {
        claimsRole,
        entity: input.tableName,
        found: true,
        isAuthenticated,
        webhookId: input.webhookId,
      };
    }),
});
