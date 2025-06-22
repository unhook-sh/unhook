'use client';

import { Button } from '@unhook/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@unhook/ui/components/dialog';
import { Input } from '@unhook/ui/components/input';
import { Label } from '@unhook/ui/components/label';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                type="number"
                placeholder="e.g. 3000"
                value={localPort}
                onChange={(e) => setLocalPort(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Webhook
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
