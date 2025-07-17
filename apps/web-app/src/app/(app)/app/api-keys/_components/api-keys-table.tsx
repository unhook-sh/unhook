'use client';

import {
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconTrash,
} from '@tabler/icons-react';
import { api } from '@unhook/api/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@unhook/ui/alert-dialog';
import { Button } from '@unhook/ui/button';
import { CopyButton } from '@unhook/ui/custom/copy-button';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@unhook/ui/tooltip';
import { format } from 'date-fns';
import { useState } from 'react';

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
  const apiKeys = api.apiKeys.all.useQuery();
  const apiUtils = api.useUtils();
  const deleteApiKey = api.apiKeys.delete.useMutation({
    onSettled: (_, __, variables) => {
      setDeletingKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variables.id);
        return newSet;
      });
    },
    onSuccess: () => {
      apiUtils.apiKeys.all.invalidate();
    },
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());

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

  const handleDeleteClick = (id: string) => {
    setKeyToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (keyToDelete) {
      setDeletingKeys((prev) => new Set(prev).add(keyToDelete));
      deleteApiKey.mutate({ id: keyToDelete });
      setKeyToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setKeyToDelete(null);
  };

  const getApiKeyName = (id: string) => {
    return apiKeys.data?.find((key) => key.id === id)?.name || 'this API key';
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
                    <Tooltip>
                      <TooltipTrigger>{apiKey.name}</TooltipTrigger>
                      <TooltipContent>{apiKey.name}</TooltipContent>
                    </Tooltip>
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
                    {format(apiKey.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                  </TableCell>
                  <TableCell>
                    {apiKey.lastUsedAt
                      ? format(apiKey.lastUsedAt, "MMMM d, yyyy 'at' h:mm a")
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <AlertDialog
                      onOpenChange={(open) => !open && setKeyToDelete(null)}
                      open={keyToDelete === apiKey.id}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={deletingKeys.has(apiKey.id)}
                          onClick={() => handleDeleteClick(apiKey.id)}
                          size="sm"
                          variant="ghost"
                        >
                          {deletingKeys.has(apiKey.id) ? (
                            <IconLoader2 className="animate-spin" size="sm" />
                          ) : (
                            <IconTrash size="sm" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "
                            {getApiKeyName(apiKey.id)}"? This action cannot be
                            undone and will immediately revoke access for any
                            applications using this key.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={handleCancelDelete}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deletingKeys.has(apiKey.id)}
                            onClick={handleConfirmDelete}
                          >
                            {deletingKeys.has(apiKey.id) ? (
                              <>
                                <IconLoader2
                                  className="mr-2 animate-spin"
                                  size="sm"
                                />
                                Deleting...
                              </>
                            ) : (
                              'Delete API Key'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
