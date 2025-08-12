'use client';
import { useQueryClient } from '@tanstack/react-query';
import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import type { WebhookType } from '@unhook/db/schema';
import { useSubscription } from '@unhook/db/supabase/client';
import { Badge } from '@unhook/ui/badge';
import { Icons } from '@unhook/ui/custom/icons';
import { P } from '@unhook/ui/custom/typography';
import { formatNumber } from '@unhook/ui/lib/format-number';
import { toast } from '@unhook/ui/sonner';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import posthog from 'posthog-js';
import { useState } from 'react';

// Animation variants for the cards
const cardVariants = {
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
};

export function WebhooksList() {
  const [webhooks, { refetch }] = api.webhooks.all.useSuspenseQuery();
  const { mutateAsync: deleteWebhook } = api.webhooks.delete.useMutation();
  const queryClient = useQueryClient();

  // Track webhooks list view
  useState(() => {
    posthog.capture('webhooks_list_viewed', {
      location: 'webhooks_page',
      webhook_count: webhooks.length,
    });
  });

  useSubscription({
    event: '*',
    onDelete: () => {
      console.log('onDelete');
      void refetch();
    },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
    onInsert: () => {
      console.log('onInsert');
      void refetch();
    },
    onStatusChange: (newStatus) => {
      console.log('Subscription status:', newStatus);
    },
    onUpdate: () => {
      console.log('onUpdate');
      void refetch();
    },
    table: 'webhooks',
  });

  const handleWebhookDelete = async (webhook: WebhookType) => {
    // Track webhook deletion attempt
    posthog.capture('webhook_deletion_attempted', {
      location: 'webhooks_list',
      request_count: webhook.requestCount,
      webhook_id: webhook.id,
      webhook_name: webhook.name || `tun_${webhook.id}`,
      webhook_status: webhook.status,
    });

    try {
      await deleteWebhook({ id: webhook.id });
      await queryClient.invalidateQueries({
        queryKey: ['webhooks', 'all'],
      });

      // Track successful webhook deletion
      posthog.capture('webhook_deleted_successfully', {
        location: 'webhooks_list',
        request_count: webhook.requestCount,
        webhook_id: webhook.id,
        webhook_name: webhook.name || `tun_${webhook.id}`,
        webhook_status: webhook.status,
      });

      toast.success('Webhook deleted', {
        description: 'The webhook has been deleted successfully.',
      });
    } catch (_error) {
      // Track webhook deletion failure
      posthog.capture('webhook_deletion_failed', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
        location: 'webhooks_list',
        request_count: webhook.requestCount,
        webhook_id: webhook.id,
        webhook_name: webhook.name || `tun_${webhook.id}`,
        webhook_status: webhook.status,
      });

      toast.error('Failed to delete webhook', {
        description: 'Please try again.',
      });
    }
  };

  const handleWebhookSettings = (webhook: WebhookType) => {
    posthog.capture('webhook_settings_accessed', {
      location: 'webhooks_list',
      webhook_id: webhook.id,
      webhook_name: webhook.name || `tun_${webhook.id}`,
      webhook_status: webhook.status,
    });
  };

  if (!webhooks.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Icons.ChevronsLeftRightEllipsis size="xl" variant="muted" />
        <div className="text-center">
          <P className="text-muted-foreground">No webhooks found.</P>
          <P className="text-muted-foreground">
            Create a webhook to get started.
          </P>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {webhooks.map((webhook) => (
          <motion.div
            animate="visible"
            exit="exit"
            initial="hidden"
            key={webhook.id}
            layout
            layoutId={webhook.id}
            variants={cardVariants}
          >
            <div className="flex flex-col gap-4 rounded-lg border p-6 transition-all hover:border-primary/50 hover:shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {/* <P className="font-medium">{webhook.clientId}</P> */}
                  <Badge
                    variant={
                      webhook.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {webhook.status}
                  </Badge>
                </div>
                <P className="text-sm text-muted-foreground">
                  tun_{webhook.id}
                </P>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icons.Share size="sm" variant="muted" />
                  {/* <P className="text-sm">Local Port: {webhook.port}</P> */}
                </div>
                <div className="flex items-center gap-2">
                  <Icons.ExternalLink size="sm" variant="muted" />
                  <P className="text-sm text-muted-foreground truncate">
                    https://{webhook.id}.unhook.sh
                  </P>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.Clock size="sm" variant="muted" />
                  <P className="text-sm text-muted-foreground">
                    Last Active:{' '}
                    {webhook.updatedAt
                      ? formatDistanceToNow(webhook.updatedAt, {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </P>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Icons.BarChart2 className="mr-1" size="xs" />
                  {formatNumber(webhook.requestCount)} Request
                  {webhook.requestCount !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="flex items-center justify-end gap-2">
                <MetricButton
                  metric="webhooks_list_settings_clicked"
                  onClick={() => handleWebhookSettings(webhook)}
                  size="sm"
                  variant="ghost"
                >
                  <Icons.Settings size="sm" variant="muted" />
                </MetricButton>
                <MetricButton
                  metric="webhooks_list_delete_clicked"
                  onClick={() => handleWebhookDelete(webhook)}
                  size="sm"
                  variant="ghost"
                >
                  <Icons.Trash size="sm" variant="destructive" />
                </MetricButton>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
