'use client';

import { IconPencil } from '@tabler/icons-react';
import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { TimezoneDisplay } from '@unhook/ui/custom/timezone-display';
import * as Editable from '@unhook/ui/diceui/editable-input';
import { Input } from '@unhook/ui/input';
import { CodeBlock, CodeBlockCode } from '@unhook/ui/magicui/code-block';
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
import { Eye, FileCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import posthog from 'posthog-js';
import { Fragment, useState } from 'react';
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
  const org = api.org.current.useQuery();
  const router = useRouter();
  const { theme } = useTheme();
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
  const [expandedConfigWebhookId, setExpandedConfigWebhookId] = useState<
    string | null
  >(null);

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

  const handleNavigateToWebhook = (webhookId: string) => {
    posthog.capture('webhooks_table_navigate_clicked', {
      webhook_id: webhookId,
    });
    router.push(`/app/webhooks/${webhookId}`);
  };

  const getWebhookUrl = (webhookName: string) => {
    const baseUrl =
      env.NEXT_PUBLIC_WEBHOOK_BASE_URL ||
      env.NEXT_PUBLIC_API_URL ||
      'https://unhook.sh';
    const orgName = org.data?.name || 'org';
    return `${baseUrl}/${orgName}/${webhookName}`;
  };

  const generateUnhookYml = (webhookUrl: string) => {
    return `# Unhook Configuration
# This file configures how Unhook delivers webhooks to your local development environment
# Save this as unhook.yml or unhook.yaml in your project root

webhookUrl: ${webhookUrl}

# Define where to deliver webhooks
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
    ping: true  # Health check endpoint

# Define which webhook sources to accept
delivery:
  - destination: local
    source: "*"  # Accept all sources, or specify: "stripe", "github", "clerk", etc.

# Optional: Configure webhook sources with specific settings
# source:
#   - name: stripe
#     secret: your-stripe-webhook-secret
#     verification: true
#   - name: github
#     secret: your-github-webhook-secret
#     verification: true

# Optional: Server configuration
# server:
#   apiUrl: https://api.unhook.sh
#   dashboardUrl: https://unhook.sh

# Optional: Enable debug mode
# debug: true

# Optional: Disable telemetry
# telemetry: false`;
  };

  return (
    <>
      <div className="rounded border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Webhook URL</TableHead>
              <TableHead>Last Request</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="h-24 text-center" colSpan={4}>
                  No webhooks found. Create your first webhook to get started.
                </TableCell>
              </TableRow>
            ) : (
              // Show actual data when loaded
              webhooks.data?.map((webhook) => {
                const configContent = generateUnhookYml(
                  getWebhookUrl(webhook.name),
                );
                const isConfigExpanded = expandedConfigWebhookId === webhook.id;

                return (
                  <Fragment key={webhook.id}>
                    <TableRow>
                      <TableCell className="font-medium truncate max-w-40">
                        <div className="flex items-center gap-2">
                          {webhook.status === 'active' && (
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                          )}
                          <Editable.Root
                            className="flex flex-row items-center gap-1.5 flex-1"
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
                        </div>
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
                        {webhook.lastRequestAt ? (
                          <TimezoneDisplay date={webhook.lastRequestAt} />
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <MetricButton
                            className="h-8 w-8 p-0"
                            metric="webhooks_table_navigate_clicked"
                            onClick={() => handleNavigateToWebhook(webhook.id)}
                            size="sm"
                            variant="ghost"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View webhook</span>
                          </MetricButton>
                          <MetricButton
                            className="h-8 w-8 p-0"
                            metric="webhooks_table_config_clicked"
                            onClick={() => {
                              setExpandedConfigWebhookId(
                                isConfigExpanded ? null : webhook.id,
                              );
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            <FileCode className="h-4 w-4" />
                            <span className="sr-only">View config</span>
                          </MetricButton>
                          <MetricButton
                            className="h-8 w-8 p-0"
                            metric="webhooks_table_delete_clicked"
                            onClick={() => {
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
                        </div>
                      </TableCell>
                    </TableRow>
                    {isConfigExpanded && (
                      <TableRow className="animate-in fade-in slide-in-from-top-2">
                        <TableCell className="p-0 bg-muted/50" colSpan={4}>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-foreground">
                                unhook.yml Configuration
                              </span>
                              <CopyButton
                                className="gap-2"
                                size="sm"
                                text={configContent}
                                variant="outline"
                              />
                            </div>
                            <CodeBlock className="border-0 rounded-none bg-transparent">
                              <CodeBlockCode
                                code={configContent}
                                language="yaml"
                                theme={
                                  theme === 'dark'
                                    ? 'github-dark'
                                    : 'github-light'
                                }
                              />
                            </CodeBlock>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
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
