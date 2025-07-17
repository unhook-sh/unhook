'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@unhook/ui/dialog';

interface EditForwardingRuleDialogProps {
  ruleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditForwardingRuleDialog({
  ruleId,
  open,
  onOpenChange,
}: EditForwardingRuleDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Forwarding Rule</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {/* TODO: Implement edit form */}
          <p className="text-muted-foreground">Edit rule: {ruleId}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
