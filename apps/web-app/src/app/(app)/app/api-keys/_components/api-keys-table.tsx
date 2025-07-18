'use client';

import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { api } from '@unhook/api/react';
import { Button } from '@unhook/ui/button';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { TimeDisplay } from '@unhook/ui/custom/time-display';
import { Input } from '@unhook/ui/input';
import { Skeleton } from '@unhook/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import { useState } from 'react';
import { DeleteApiKeyDialog } from './delete-api-key-dialog';
import { EditApiKeyDialog } from './edit-api-key-dialog';

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
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const maskApiKey = (key: string) => {
    const prefixLength = 10;
    const postfixLength = 4;
    const fillLength = key.length - prefixLength - postfixLength;
    return `${key.slice(0, prefixLength)}${'*'.repeat(fillLength)}${key.slice(-postfixLength)}`;
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
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
                    <EditApiKeyDialog
                      apiKeyId={apiKey.id}
                      currentName={apiKey.name}
                    />
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
                      <Button
                        className="h-8 w-8 p-0"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        size="sm"
                        variant="ghost"
                      >
                        {showKeys[apiKey.id] ? (
                          <IconEye size="sm" />
                        ) : (
                          <IconEyeOff size="sm" />
                        )}
                      </Button>
                      <CopyButton
                        className="h-8 w-8 p-0"
                        size="sm"
                        text={apiKey.key}
                        variant="outline"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <TimeDisplay date={apiKey.createdAt} />
                  </TableCell>
                  <TableCell>
                    {apiKey.lastUsage ? (
                      <TimeDisplay date={apiKey.lastUsage.createdAt} />
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
