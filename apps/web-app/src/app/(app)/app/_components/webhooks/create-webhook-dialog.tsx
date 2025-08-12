'use client';

import { MetricButton } from '@unhook/analytics/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@unhook/ui/dialog';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateWebhookDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWebhookDialogProps) {
  const [localPort, setLocalPort] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSuccess();
      onOpenChange(false);
      setLocalPort('');
    } catch (error) {
      console.error('Failed to create webhook:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Create a new webhook to expose your local service to the internet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="local-port">Local Port</Label>
              <Input
                id="local-port"
                onChange={(e) => setLocalPort(e.target.value)}
                placeholder="e.g. 3000"
                required
                type="number"
                value={localPort}
              />
            </div>
          </div>
          <DialogFooter>
            <MetricButton
              metric="create_webhook_cancel_clicked"
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </MetricButton>
            <MetricButton
              disabled={isSubmitting}
              metric="create_webhook_submit_clicked"
              type="submit"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Webhook
            </MetricButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
