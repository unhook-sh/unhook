'use client';

import { IconPlus } from '@tabler/icons-react';
import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import { Icons } from '@unhook/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@unhook/ui/dialog';
import { Input } from '@unhook/ui/input';
import posthog from 'posthog-js';
import { useState } from 'react';

export function CreateApiKeyDialog() {
  const apiUtils = api.useUtils();

  const createApiKey = api.apiKeys.create.useMutation({
    onSuccess: () => {
      apiUtils.apiKeys.allWithLastUsage.invalidate();
    },
  });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      // Track the API key creation
      posthog.capture('api_keys_created', {
        api_key_name: name.trim(),
      });

      await createApiKey.mutateAsync({ name });

      // Reset form and close dialog
      setName('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleCancel = () => {
    setName('');
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <MetricButton metric="create_api_key_dialog_trigger_clicked">
          <IconPlus />
          Create API Key
        </MetricButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new API Key</DialogTitle>
          <DialogDescription>
            Please provide a name for your new API key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreate();
              }
            }}
            placeholder="Your API Key Name"
            value={name}
          />
        </div>

        <DialogFooter>
          <MetricButton
            disabled={createApiKey.isPending}
            metric="create_api_key_cancel_clicked"
            onClick={handleCancel}
            variant="outline"
          >
            Cancel
          </MetricButton>
          <MetricButton
            disabled={!name.trim() || createApiKey.isPending}
            metric="create_api_key_submit_clicked"
            onClick={handleCreate}
          >
            {createApiKey.isPending ? (
              <>
                <Icons.Spinner className="animate-spin" size="sm" />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </MetricButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
