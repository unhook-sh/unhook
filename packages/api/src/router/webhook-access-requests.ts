import { TRPCError } from '@trpc/server';
import {
  CreateWebhookAccessRequestSchema,
  OrgMembers,
  RespondToWebhookAccessRequestSchema,
  Users,
  WebhookAccessRequests,
  Webhooks,
} from '@unhook/db/schema';
import { createEmailClient } from '@unhook/email';
import {
  WebhookAccessRequestEmail,
  WebhookAccessResponseEmail,
} from '@unhook/email/templates';
import { and, desc, eq, inArray } from 'drizzle-orm';
import React from 'react';
import { z } from 'zod';
import { env as envClient } from '../env.client';
import { env as envServer } from '../env.server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const webhookAccessRequestsRouter = createTRPCRouter({
  // Cancel a pending request
  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) throw new Error('User ID is required');

      const accessRequest = await ctx.db.query.WebhookAccessRequests.findFirst({
        where: and(
          eq(WebhookAccessRequests.id, input.id),
          eq(WebhookAccessRequests.requesterId, ctx.auth.userId),
          eq(WebhookAccessRequests.status, 'pending'),
        ),
      });

      if (!accessRequest) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Access request not found or cannot be cancelled',
        });
      }

      await ctx.db
        .delete(WebhookAccessRequests)
        .where(eq(WebhookAccessRequests.id, input.id));

      return { success: true };
    }),

  // Check if user has a pending request for a webhook
  checkPendingRequest: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId) throw new Error('User ID is required');

      const request = await ctx.db.query.WebhookAccessRequests.findFirst({
        where: and(
          eq(WebhookAccessRequests.webhookId, input.webhookId),
          eq(WebhookAccessRequests.requesterId, ctx.auth.userId),
          eq(WebhookAccessRequests.status, 'pending'),
        ),
      });

      return request;
    }),
  // Create a new access request
  create: protectedProcedure
    .input(CreateWebhookAccessRequestSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) throw new Error('User ID is required');

      // First, check if the webhook exists
      const webhook = await ctx.db.query.Webhooks.findFirst({
        where: eq(Webhooks.id, input.webhookId),
      });

      if (!webhook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        });
      }

      // Check if the user already has access
      const isMember = await ctx.db.query.OrgMembers.findFirst({
        where: and(
          eq(OrgMembers.orgId, webhook.orgId),
          eq(OrgMembers.userId, ctx.auth.userId),
        ),
      });

      if (isMember) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You already have access to this webhook',
        });
      }

      // Check if there's already a pending request
      const existingRequest =
        await ctx.db.query.WebhookAccessRequests.findFirst({
          where: and(
            eq(WebhookAccessRequests.webhookId, input.webhookId),
            eq(WebhookAccessRequests.requesterId, ctx.auth.userId),
            eq(WebhookAccessRequests.status, 'pending'),
          ),
        });

      if (existingRequest) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You already have a pending request for this webhook',
        });
      }

      // Get the user's email
      const user = await ctx.db.query.Users.findFirst({
        where: eq(Users.id, ctx.auth.userId),
      });

      if (!user?.email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User email not found',
        });
      }

      // Create the access request
      const [accessRequest] = await ctx.db
        .insert(WebhookAccessRequests)
        .values({
          orgId: webhook.orgId,
          requesterEmail: user.email,
          requesterId: ctx.auth.userId,
          requesterMessage: input.requesterMessage,
          webhookId: input.webhookId,
        })
        .returning();

      // Send email notification to webhook owner(s)
      if (envServer.RESEND_API_KEY) {
        try {
          const emailClient = createEmailClient({
            apiKey: envServer.RESEND_API_KEY,
            from: envServer.EMAIL_FROM,
            replyTo: envServer.EMAIL_REPLY_TO,
          });

          // Get all organization members who should be notified
          const orgMembers = await ctx.db.query.OrgMembers.findMany({
            where: eq(OrgMembers.orgId, webhook.orgId),
            with: {
              user: true,
            },
          });

          const adminEmails = orgMembers
            .filter(
              (member) =>
                member.user?.email &&
                (member.role === 'admin' || member.role === 'superAdmin'),
            )
            .map((member) => member.user.email);

          if (adminEmails.length > 0) {
            if (!accessRequest) return;

            if (!input.requesterMessage) return;

            await emailClient.send({
              subject: `New webhook access request for ${webhook.name}`,
              template: React.createElement(WebhookAccessRequestEmail, {
                approveUrl: `${envClient.NEXT_PUBLIC_API_URL}/webhooks/${webhook.id}/access-requests?action=approve&id=${accessRequest.id}`,
                dashboardUrl: `${envClient.NEXT_PUBLIC_API_URL}/webhooks/${webhook.id}/access-requests`,
                message: input.requesterMessage,
                rejectUrl: `${envClient.NEXT_PUBLIC_API_URL}/webhooks/${webhook.id}/access-requests?action=reject&id=${accessRequest.id}`,
                requesterEmail: user.email,
                requesterName:
                  user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email,
                webhookId: webhook.id,
                webhookName: webhook.name,
              }),
              to: adminEmails,
            });
          }
        } catch (error) {
          // Log error but don't fail the request
          console.error('Failed to send access request email:', error);
        }
      }

      return accessRequest;
    }),

  // Get access requests for webhooks the user owns
  listForOwner: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(['pending', 'approved', 'rejected', 'expired'])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const webhooks = await ctx.db
        .select({ id: Webhooks.id })
        .from(Webhooks)
        .where(eq(Webhooks.orgId, ctx.auth.orgId));

      const webhookIds = webhooks.map((w) => w.id);

      if (webhookIds.length === 0) {
        return [];
      }

      const conditions = [inArray(WebhookAccessRequests.webhookId, webhookIds)];

      if (input.status) {
        conditions.push(eq(WebhookAccessRequests.status, input.status));
      }

      const requests = await ctx.db.query.WebhookAccessRequests.findMany({
        orderBy: desc(WebhookAccessRequests.createdAt),
        where: and(...conditions),
        with: {
          requester: true,
          webhook: true,
        },
      });

      return requests;
    }),

  // Get access requests made by the current user
  listForRequester: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) throw new Error('User ID is required');

    const requests = await ctx.db.query.WebhookAccessRequests.findMany({
      orderBy: desc(WebhookAccessRequests.createdAt),
      where: eq(WebhookAccessRequests.requesterId, ctx.auth.userId),
      with: {
        webhook: true,
      },
    });

    return requests;
  }),

  // Respond to an access request (approve/reject)
  respond: protectedProcedure
    .input(RespondToWebhookAccessRequestSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) throw new Error('User ID is required');
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      // Get the access request
      const accessRequest = await ctx.db.query.WebhookAccessRequests.findFirst({
        where: eq(WebhookAccessRequests.id, input.id),
        with: {
          webhook: true,
        },
      });

      if (!accessRequest) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Access request not found',
        });
      }

      // Verify the user has permission to respond (must be in the same org)
      if (accessRequest.webhook.orgId !== ctx.auth.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to respond to this request',
        });
      }

      // Update the access request
      const [updatedRequest] = await ctx.db
        .update(WebhookAccessRequests)
        .set({
          respondedAt: new Date(),
          responderId: ctx.auth.userId,
          responseMessage: input.responseMessage,
          status: input.status,
        })
        .where(eq(WebhookAccessRequests.id, input.id))
        .returning();

      // If approved, add the user to the organization
      if (input.status === 'approved') {
        await ctx.db.insert(OrgMembers).values({
          orgId: accessRequest.orgId,
          role: 'user',
          userId: accessRequest.requesterId,
        });
      }

      // Send email notification to requester
      if (envServer.RESEND_API_KEY && updatedRequest) {
        try {
          const emailClient = createEmailClient({
            apiKey: envServer.RESEND_API_KEY,
            from: envServer.EMAIL_FROM,
            replyTo: envServer.EMAIL_REPLY_TO,
          });

          // Get requester details
          const requester = await ctx.db.query.Users.findFirst({
            where: eq(Users.id, accessRequest.requesterId),
          });

          if (requester?.email) {
            await emailClient.send({
              subject: `Your webhook access request has been ${input.status}`,
              template: React.createElement(WebhookAccessResponseEmail, {
                cliCommand:
                  input.status === 'approved'
                    ? `unhook start ${accessRequest.webhook.id}`
                    : undefined,
                dashboardUrl:
                  input.status === 'approved'
                    ? `${envClient.NEXT_PUBLIC_API_URL}/webhooks/${accessRequest.webhook.id}`
                    : undefined,
                requesterName: requester.firstName || requester.email,
                responseMessage: input.responseMessage,
                status: input.status,
                webhookId: accessRequest.webhook.id,
                webhookName: accessRequest.webhook.name,
              }),
              to: requester.email,
            });
          }
        } catch (error) {
          // Log error but don't fail the request
          console.error('Failed to send access response email:', error);
        }
      }

      return updatedRequest;
    }),
});
