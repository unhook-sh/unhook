'use client';

import { useOrganization } from '@clerk/nextjs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@unhook/ui/alert-dialog';
import { toast } from '@unhook/ui/sonner';

interface DeleteOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteOrganizationDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteOrganizationDialogProps) {
  const { organization: activeOrg } = useOrganization();

  const handleConfirm = async () => {
    try {
      await onConfirm();
      toast.success('Organization deleted successfully');
    } catch (error) {
      toast.error('Failed to delete organization', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Organization</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{activeOrg?.name}"? This action
            cannot be undone. This will permanently delete your organization and
            remove all data, including webhooks, requests, and member access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={handleConfirm}
          >
            {isDeleting ? 'Deleting...' : 'Delete Organization'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
