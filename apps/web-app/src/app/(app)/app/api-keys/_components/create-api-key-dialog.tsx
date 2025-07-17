'use client';

import { Button } from '@unhook/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@unhook/ui/components/dialog';
import { Input } from '@unhook/ui/components/input';
import { Icons } from '@unhook/ui/custom/icons';
import { useState } from 'react';

export function CreateApiKeyDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      // TODO: Implement actual API key creation
      console.log('Creating API key:', name);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form and close dialog
      setName('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setIsCreating(false);
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
            disabled={isCreating}
            onClick={handleCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={!name.trim() || isCreating} onClick={handleCreate}>
            {isCreating ? (
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
