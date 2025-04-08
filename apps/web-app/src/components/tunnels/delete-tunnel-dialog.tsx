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
import type { Tunnel } from '~/types/tunnel';

interface DeleteTunnelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tunnel: Tunnel | null;
  onConfirm: () => void;
}

export function DeleteTunnelDialog({
  open,
  onOpenChange,
  tunnel,
  onConfirm,
}: DeleteTunnelDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!tunnel) return;

    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onConfirm();
    } catch (error) {
      console.error('Failed to delete tunnel:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!tunnel) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the tunnel{' '}
            <span className="font-mono font-bold">{tunnel.id}</span> and all
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
