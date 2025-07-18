'use client';

import { api } from '@unhook/api/react';
import { Button } from '@unhook/ui/button';
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
        <Button>
          <Icons.Plus size="sm" />
          Create API Key
        </Button>
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
          <Button
            disabled={createApiKey.isPending}
            onClick={handleCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || createApiKey.isPending}
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
