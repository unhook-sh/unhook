'use client';
import { api } from '@acme/api/client';
import { useSubscription } from '@acme/db/supabase/client';
import { Badge } from '@acme/ui/badge';
import { Button } from '@acme/ui/button';
import { Icons } from '@acme/ui/custom/icons';
import { P } from '@acme/ui/custom/typography';
import { formatNumber } from '@acme/ui/lib/format-number';
import { toast } from '@acme/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

// Animation variants for the cards
const cardVariants = {
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
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
      ease: 'easeOut',
    },
  },
};

export function TunnelsList() {
  const [tunnels, { refetch }] = api.tunnels.all.useSuspenseQuery();
  const { mutateAsync: deleteTunnel } = api.tunnels.delete.useMutation();
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
    table: 'tunnels',
  });

  if (!tunnels.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Icons.ChevronsLeftRightEllipsis size="xl" variant="muted" />
        <div className="text-center">
          <P className="text-muted-foreground">No tunnels found.</P>
          <P className="text-muted-foreground">
            Create a tunnel to get started.
          </P>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {tunnels.map((tunnel) => (
          <motion.div
            key={tunnel.id}
            layout
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layoutId={tunnel.id}
          >
            <div className="flex flex-col gap-4 rounded-lg border p-6 transition-all hover:border-primary/50 hover:shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <P className="font-medium">{tunnel.clientId}</P>
                  <Badge
                    variant={
                      tunnel.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {tunnel.status}
                  </Badge>
                </div>
                <P className="text-sm text-muted-foreground">tun_{tunnel.id}</P>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icons.Share size="sm" variant="muted" />
                  <P className="text-sm">Local Port: {tunnel.port}</P>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.ExternalLink size="sm" variant="muted" />
                  <P className="text-sm text-muted-foreground truncate">
                    https://{tunnel.clientId}.tunnel.example.com
                  </P>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.Clock size="sm" variant="muted" />
                  <P className="text-sm text-muted-foreground">
                    Last Active:{' '}
                    {tunnel.lastConnectionAt
                      ? formatDistanceToNow(tunnel.lastConnectionAt, {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </P>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Icons.User size="xs" className="mr-1" />
                  {tunnel.clientCount} Client
                  {tunnel.clientCount !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline">
                  <Icons.BarChart2 size="xs" className="mr-1" />
                  {formatNumber(tunnel.requestCount)} Request
                  {tunnel.requestCount !== 1 ? 's' : ''}
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
                      await deleteTunnel({ id: tunnel.id });
                      await queryClient.invalidateQueries({
                        queryKey: ['tunnels', 'all'],
                      });
                      toast.success('Tunnel deleted', {
                        description:
                          'The tunnel has been deleted successfully.',
                      });
                    } catch (_error) {
                      toast.error('Failed to delete tunnel', {
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
