'use client';

import { IconLoader2 } from '@tabler/icons-react';
import { api } from '@unhook/api/react';
import { Button } from '@unhook/ui/button';
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
import { Label } from '@unhook/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@unhook/ui/tooltip';
import { useState } from 'react';

interface EditApiKeyDialogProps {
  apiKeyId: string;
  currentName: string;
  onUpdate?: () => void;
}

export function EditApiKeyDialog({
  apiKeyId,
  currentName,
  onUpdate,
}: EditApiKeyDialogProps) {
  const apiUtils = api.useUtils();
  const updateApiKey = api.apiKeys.update.useMutation({
    onSettled: () => {
      setUpdating(false);
    },
    onSuccess: () => {
      apiUtils.apiKeys.allWithLastUsage.invalidate();
      onUpdate?.();
      setIsOpen(false);
    },
  });
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [name, setName] = useState(currentName);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setName(currentName);
    }
  };

  const handleEditClick = () => {
    console.log('Edit click handler called');
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentName) {
      setUpdating(true);
      updateApiKey.mutate({ id: apiKeyId, name: name.trim() });
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setName(currentName);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-auto w-full justify-start p-2 text-left font-medium"
              onClick={handleEditClick}
              variant="ghost"
            >
              {currentName}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Click to edit name</TooltipContent>
        </Tooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit API Key Name</DialogTitle>
          <DialogDescription>
            Update the name for your API key to help you identify it more
            easily.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                autoFocus
                disabled={updating}
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter API key name"
                value={name}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={updating}
              onClick={handleCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={updating || !name.trim() || name.trim() === currentName}
              type="submit"
            >
              {updating ? (
                <>
                  <IconLoader2 className="mr-2 animate-spin" size="sm" />
                  Updating...
                </>
              ) : (
                'Update Name'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
