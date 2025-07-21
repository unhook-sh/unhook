'use client';

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
import { toast } from '@unhook/ui/sonner';
import { Trash2 } from 'lucide-react';

interface DeleteEventDialogProps {
  eventId: string;
  eventName: string;
}

export function DeleteEventDialog({
  eventId,
  eventName,
}: DeleteEventDialogProps) {
  const apiUtils = api.useUtils();
  const deleteEvent = api.events.delete.useMutation({
    onError: (error) => {
      toast.error(`Failed to delete event: ${error.message}`);
    },
    onSuccess: () => {
      apiUtils.events.all.invalidate();
      toast.success('Event deleted successfully');
    },
  });

  const handleDelete = () => {
    deleteEvent.mutate({ id: eventId });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the event "{eventName}"? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={deleteEvent.isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteEvent.isPending ? 'Deleting...' : 'Delete Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
