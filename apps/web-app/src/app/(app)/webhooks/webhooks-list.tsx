'use client';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@unhook/api/react';
import { useSubscription } from '@unhook/db/supabase/client';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { Icons } from '@unhook/ui/custom/icons';
import { P } from '@unhook/ui/custom/typography';
import { formatNumber } from '@unhook/ui/lib/format-number';
import { toast } from '@unhook/ui/sonner';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';

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
            key={webhook.id}
            layout
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layoutId={webhook.id}
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
                    https://{webhook.id}.webhook.unhook.dev
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
                  <Icons.BarChart2 size="xs" className="mr-1" />
                  {formatNumber(webhook.requestCount)} Request
                  {webhook.requestCount !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm">
                  <Icons.Settings size="sm" variant="muted" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await deleteWebhook({ id: webhook.id });
                      await queryClient.invalidateQueries({
                        queryKey: ['webhooks', 'all'],
                      });
                      toast.success('Webhook deleted', {
                        description:
                          'The webhook has been deleted successfully.',
                      });
                    } catch (_error) {
                      toast.error('Failed to delete webhook', {
                        description: 'Please try again.',
                      });
                    }
                  }}
                >
                  <Icons.Trash size="sm" variant="destructive" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
