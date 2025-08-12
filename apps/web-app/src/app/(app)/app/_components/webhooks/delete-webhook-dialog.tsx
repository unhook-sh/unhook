'use client';

import { MetricButton } from '@unhook/analytics/components';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@unhook/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
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
    <AlertDialog onOpenChange={onOpenChange} open={open}>
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
          <MetricButton
            disabled={isDeleting}
            metric="delete_webhook_confirm_clicked"
            onClick={handleDelete}
            variant="destructive"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </MetricButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
