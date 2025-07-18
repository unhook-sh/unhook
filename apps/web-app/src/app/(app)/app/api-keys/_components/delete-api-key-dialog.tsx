'use client';

import { IconLoader2, IconTrash } from '@tabler/icons-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@unhook/ui/tooltip';
import { useState } from 'react';

interface DeleteApiKeyDialogProps {
  apiKeyId: string;
  apiKeyName: string;
  onDelete?: () => void;
}

export function DeleteApiKeyDialog({
  apiKeyId,
  apiKeyName,
  onDelete,
}: DeleteApiKeyDialogProps) {
  const apiUtils = api.useUtils();
  const deleteApiKey = api.apiKeys.delete.useMutation({
    onSettled: () => {
      setDeleting(false);
    },
    onSuccess: () => {
      apiUtils.apiKeys.allWithLastUsage.invalidate();
      onDelete?.();
    },
  });
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = () => {
    setIsOpen(true);
  };

  const handleConfirmDelete = () => {
    setDeleting(true);
    deleteApiKey.mutate({ id: apiKeyId });
  };

  const handleCancelDelete = () => {
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={isOpen}>
      <AlertDialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              disabled={deleting}
              onClick={handleDeleteClick}
              size="sm"
              variant="ghost"
            >
              {deleting ? (
                <IconLoader2 className="animate-spin" size="sm" />
              ) : (
                <IconTrash size="sm" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete API Key</TooltipContent>
        </Tooltip>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete API Key</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{apiKeyName}"? This action cannot
            be undone and will immediately revoke access for any applications
            using this key.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelDelete}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleting}
            onClick={handleConfirmDelete}
          >
            {deleting ? (
              <>
                <IconLoader2 className="mr-2 animate-spin" size="sm" />
                Deleting...
              </>
            ) : (
              'Delete API Key'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
