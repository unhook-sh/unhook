'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@unhook/ui/dialog';

interface TestForwardingRuleDialogProps {
  ruleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestForwardingRuleDialog({
  ruleId,
  open,
  onOpenChange,
}: TestForwardingRuleDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Forwarding Rule</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {/* TODO: Implement test functionality */}
          <p className="text-muted-foreground">Test rule: {ruleId}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
