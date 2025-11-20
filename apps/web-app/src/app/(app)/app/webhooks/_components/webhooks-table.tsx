'use client';

import { useOrganization } from '@clerk/nextjs';
import { IconPencil } from '@tabler/icons-react';
import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import { Badge } from '@unhook/ui/badge';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { TimezoneDisplay } from '@unhook/ui/custom/timezone-display';
import * as Editable from '@unhook/ui/diceui/editable-input';
import { Input } from '@unhook/ui/input';
import { Skeleton } from '@unhook/ui/skeleton';
import { toast } from '@unhook/ui/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@unhook/ui/tooltip';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';
import { env } from '~/env.client';
import { DeleteWebhookDialog } from './delete-webhook-dialog';

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-8 w-[106.5px]" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[350px]" />
          <Skeleton className="size-8 rounded" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[80px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[150px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[150px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="size-8 rounded w-[150px]" />
      </TableCell>
    </TableRow>
  );
}

export function WebhooksTable() {
  const webhooks = api.webhooks.all.useQuery();
  const apiUtils = api.useUtils();
  const { organization } = useOrganization();
  const router = useRouter();
  const updateWebhook = api.webhooks.update.useMutation({
    onSuccess: () => {
      apiUtils.webhooks.all.invalidate();
    },
  });
  const deleteWebhookMutation = api.webhooks.delete.useMutation({
    onError: (error) => {
      toast.error(`Failed to delete webhook: ${error.message}`);
    },
    onSuccess: () => {
      apiUtils.webhooks.all.invalidate();
      toast.success('Webhook deleted successfully');
    },
  });

  const [webhookToDelete, setWebhookToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleUpdateWebhookName = ({
    webhookId,
    oldName,
    newName,
    apiKeyId,
  }: {
    webhookId: string;
    oldName: string;
    newName: string;
    apiKeyId: string;
  }) => {
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== '' && trimmedName !== oldName) {
      // Track the webhook name update
      posthog.capture('webhooks_name_updated', {
        new_name: trimmedName,
        old_name: oldName,
        webhook_id: webhookId,
      });
      updateWebhook.mutate({ apiKeyId, id: webhookId, name: trimmedName });
      toast.success('Webhook name updated');
    }
  };

  const handleDeleteWebhook = async () => {
    if (!webhookToDelete) return;

    posthog.capture('webhooks_deleted', {
      webhook_id: webhookToDelete.id,
      webhook_name: webhookToDelete.name,
    });

    await deleteWebhookMutation.mutateAsync({ id: webhookToDelete.id });
    setWebhookToDelete(null);
  };

  const handleRowClick = (webhookId: string) => {
    posthog.capture('webhooks_table_row_clicked', {
      webhook_id: webhookId,
    });
    router.push(`/app/webhooks/${webhookId}`);
  };

  const getWebhookUrl = (webhookName: string) => {
    const baseUrl =
      env.NEXT_PUBLIC_WEBHOOK_BASE_URL ||
      env.NEXT_PUBLIC_API_URL ||
      'https://unhook.sh';
    const orgName = organization?.slug || 'org';
    return `${baseUrl}/${orgName}/${webhookName}`;
  };

  return (
    <>
      <div className="rounded border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Webhook URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Request</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.isLoading ? (
              // Show skeleton rows while loading
              ['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
                <SkeletonRow key={key} />
              ))
            ) : webhooks.data?.length === 0 ? (
              // Show empty state
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={6}>
                  No webhooks found. Create your first webhook to get started.
                </TableCell>
              </TableRow>
            ) : (
              // Show actual data when loaded
              webhooks.data?.map((webhook) => (
                <TableRow
                  className="cursor-pointer hover:bg-muted/50"
                  key={webhook.id}
                  onClick={(e) => {
                    // Don't navigate if clicking on interactive elements
                    const target = e.target as HTMLElement;
                    if (
                      target.closest('button') ||
                      target.closest('input') ||
                      target.closest('[role="button"]')
                    ) {
                      return;
                    }
                    handleRowClick(webhook.id);
                  }}
                >
                  <TableCell className="font-medium truncate max-w-40">
                    <Editable.Root
                      className="flex flex-row items-center gap-1.5"
                      defaultValue={webhook.name}
                      onSubmit={(value) =>
                        handleUpdateWebhookName({
                          apiKeyId: webhook.apiKeyId,
                          newName: value,
                          oldName: webhook.name,
                          webhookId: webhook.id,
                        })
                      }
                    >
                      <Editable.Area className="flex-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Editable.Preview className="w-full rounded-md px-1.5 py-1" />
                          </TooltipTrigger>
                          <TooltipContent>{webhook.name}</TooltipContent>
                        </Tooltip>
                        <Editable.Input className="px-1.5 py-1" />
                      </Editable.Area>
                      <Editable.Trigger asChild>
                        <MetricButton
                          className="size-7"
                          metric="webhooks_table_edit_name_clicked"
                          size="icon"
                          variant="ghost"
                        >
                          <IconPencil />
                        </MetricButton>
                      </Editable.Trigger>
                    </Editable.Root>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        className="font-mono text-sm min-w-60"
                        readOnly
                        value={getWebhookUrl(webhook.name)}
                      />
                      <CopyButton
                        className="h-8 w-8 p-0"
                        size="sm"
                        text={getWebhookUrl(webhook.name)}
                        variant="outline"
                      />
                    </div>
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
                    {webhook.createdAt ? (
                      <TimezoneDisplay date={webhook.createdAt} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {webhook.lastRequestAt ? (
                      <TimezoneDisplay date={webhook.lastRequestAt} />
                    ) : (
                      'Never'
                    )}
                  </TableCell>
                  <TableCell>
                    <MetricButton
                      className="h-8 w-8 p-0"
                      metric="webhooks_table_delete_clicked"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWebhookToDelete({
                          id: webhook.id,
                          name: webhook.name,
                        });
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title>Delete webhook</title>
                        <path
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </MetricButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteWebhookDialog
        onConfirm={handleDeleteWebhook}
        onOpenChange={(open) => !open && setWebhookToDelete(null)}
        open={!!webhookToDelete}
        webhook={
          webhookToDelete
            ? {
                deliveredAddress: getWebhookUrl(webhookToDelete.name),
                id: webhookToDelete.id,
                name: webhookToDelete.name,
              }
            : null
        }
      />
    </>
  );
}
