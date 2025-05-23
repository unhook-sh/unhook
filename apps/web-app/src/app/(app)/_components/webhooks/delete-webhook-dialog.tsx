'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@unhook/ui/components/alert-dialog';
import { Button } from '@unhook/ui/components/button';
import type { Webhook } from '~/types/webhook';

interface DeleteWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: Webhook | null;
  onConfirm: () => void;
}

export function DeleteWebhookDialog({
  open,
  onOpenChange,
  webhook,
  onConfirm,
}: DeleteWebhookDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!webhook) return;

    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onConfirm();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!webhook) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the webhook{' '}
            <span className="font-mono font-bold">{webhook.id}</span> and all
            associated data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
