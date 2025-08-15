'use client';

import { IconEye, IconEyeOff, IconPencil } from '@tabler/icons-react';
import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
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
import posthog from 'posthog-js';
import { useState } from 'react';
import { maskApiKey } from '~/lib/mask-api-key';
import { DeleteApiKeyDialog } from './delete-api-key-dialog';

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
          <Skeleton className="size-8 rounded" />
        </div>
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

export function ApiKeysTable() {
  const apiKeys = api.apiKeys.allWithLastUsage.useQuery();
  const apiUtils = api.useUtils();
  const updateApiKey = api.apiKeys.update.useMutation({
    onSuccess: () => {
      apiUtils.apiKeys.allWithLastUsage.invalidate();
    },
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (id: string) => {
    const newVisibility = !showKeys[id];
    // Track the API key visibility toggle
    posthog.capture('api_keys_visibility_toggled', {
      api_key_id: id,
      new_visibility: newVisibility,
    });
    setShowKeys((prev) => ({
      ...prev,
      [id]: newVisibility,
    }));
  };

  const handleUpdateApiKeyName = ({
    apiKeyId,
    oldName,
    newName,
  }: {
    apiKeyId: string;
    oldName: string;
    newName: string;
  }) => {
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== '' && trimmedName !== oldName) {
      // Track the API key name update
      posthog.capture('api_keys_name_updated', {
        api_key_id: apiKeyId,
        new_name: trimmedName,
        old_name: oldName,
      });
      updateApiKey.mutate({ id: apiKeyId, name: trimmedName });
      toast.success('API key name updated');
    }
  };

  return (
    <div className="rounded border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.isLoading
            ? // Show skeleton rows while loading
              ['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
                <SkeletonRow key={key} />
              ))
            : // Show actual data when loaded
              apiKeys.data?.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium truncate max-w-40">
                    <Editable.Root
                      className="flex flex-row items-center gap-1.5"
                      defaultValue={apiKey.name}
                      onSubmit={(value) =>
                        handleUpdateApiKeyName({
                          apiKeyId: apiKey.id,
                          newName: value,
                          oldName: apiKey.name,
                        })
                      }
                    >
                      <Editable.Area className="flex-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Editable.Preview className="w-full rounded-md px-1.5 py-1" />
                          </TooltipTrigger>
                          <TooltipContent>{apiKey.name}</TooltipContent>
                        </Tooltip>
                        <Editable.Input className="px-1.5 py-1" />
                      </Editable.Area>
                      <Editable.Trigger asChild>
                        <MetricButton
                          className="size-7"
                          metric="api_keys_table_edit_name_clicked"
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
                        // type={showKeys[apiKey.id] ? 'text' : 'password'}
                        value={
                          showKeys[apiKey.id]
                            ? apiKey.key
                            : maskApiKey(apiKey.key)
                        }
                      />
                      <MetricButton
                        className="h-8 w-8 p-0"
                        metric="api_keys_table_toggle_visibility_clicked"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        size="sm"
                        variant="ghost"
                      >
                        {showKeys[apiKey.id] ? (
                          <IconEye size="sm" />
                        ) : (
                          <IconEyeOff size="sm" />
                        )}
                      </MetricButton>
                      <CopyButton
                        className="h-8 w-8 p-0"
                        size="sm"
                        text={apiKey.key}
                        variant="outline"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <TimezoneDisplay date={apiKey.createdAt} />
                  </TableCell>
                  <TableCell>
                    {apiKey.lastUsage ? (
                      <TimezoneDisplay date={apiKey.lastUsage.createdAt} />
                    ) : (
                      'Never'
                    )}
                  </TableCell>
                  <TableCell>
                    <DeleteApiKeyDialog
                      apiKeyId={apiKey.id}
                      apiKeyName={apiKey.name}
                    />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
