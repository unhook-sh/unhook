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

interface LeaveOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLeaving: boolean;
  organizationName?: string;
}

export function LeaveOrganizationDialog({
  isOpen,
  onClose,
  onConfirm,
  isLeaving,
  organizationName,
}: LeaveOrganizationDialogProps) {
  const { organization: activeOrg } = useOrganization();

  const handleConfirm = async () => {
    try {
      await onConfirm();
      toast.success('Successfully left the organization');
    } catch (error) {
      toast.error('Failed to leave organization', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave Organization</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to leave "
            {organizationName || activeOrg?.name}"? You will lose access to all
            organization resources and data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLeaving}
            onClick={handleConfirm}
          >
            {isLeaving ? 'Leaving...' : 'Leave Organization'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
