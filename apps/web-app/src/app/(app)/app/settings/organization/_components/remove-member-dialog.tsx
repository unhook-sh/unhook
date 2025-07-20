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

interface RemoveMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRemoving: boolean;
  memberToRemove: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function RemoveMemberDialog({
  isOpen,
  onClose,
  onConfirm,
  isRemoving,
  memberToRemove,
}: RemoveMemberDialogProps) {
  const { organization: activeOrg } = useOrganization();

  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {memberToRemove?.name} (
            {memberToRemove?.email}) from "{activeOrg?.name}"? They will lose
            access to all organization resources and data. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isRemoving}
            onClick={onConfirm}
          >
            {isRemoving ? 'Removing...' : 'Remove Member'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
