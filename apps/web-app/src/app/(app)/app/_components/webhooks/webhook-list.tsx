'use client';

import { MetricButton } from '@unhook/analytics/components';
import { Badge } from '@unhook/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@unhook/ui/dropdown-menu';
import { Skeleton } from '@unhook/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Play, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Webhook } from '~/types/webhook';
import { DeleteWebhookDialog } from './delete-webhook-dialog';

interface WebhookListProps {
  webhooks: Webhook[];
  isLoading: boolean;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WebhookList({
  webhooks,
  isLoading,
  onStart,
  onStop,
  onDelete,
}: WebhookListProps) {
  const [webhookToDelete, setWebhookToDelete] = useState<Webhook | null>(null);

  const handleDelete = (webhook: Webhook) => {
    setWebhookToDelete(webhook);
  };

  const confirmDelete = () => {
    if (webhookToDelete) {
      onDelete(webhookToDelete.id);
      setWebhookToDelete(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Webhook ID</TableHead>
            <TableHead>Delivery Address</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [
              'skeleton-1',
              'skeleton-2',
              'skeleton-3',
              'skeleton-4',
              'skeleton-5',
            ].map((index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-5 w-[180px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </TableCell>
              </TableRow>
            ))
          ) : webhooks.length === 0 ? (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={5}>
                No webhooks found. Create your first webhook to get started.
              </TableCell>
            </TableRow>
          ) : (
            webhooks.map((webhook) => (
              <TableRow key={webhook.id}>
                <TableCell className="font-mono text-xs">
                  {webhook.id}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {webhook.deliveredAddress}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(webhook.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      webhook.status === 'active'
                        ? 'bg-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-500'
                        : ''
                    }
                    variant={
                      webhook.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {webhook.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <MetricButton
                        metric="webhook_list_actions_menu_opened"
                        size="icon"
                        variant="ghost"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </MetricButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {webhook.status === 'active' ? (
                        <DropdownMenuItem onClick={() => onStop(webhook.id)}>
                          <Square className="mr-2 h-4 w-4" />
                          Stop Webhook
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onStart(webhook.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          Start Webhook
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(webhook)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Webhook
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <DeleteWebhookDialog
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setWebhookToDelete(null)}
        open={!!webhookToDelete}
        webhook={webhookToDelete}
      />
    </>
  );
}
