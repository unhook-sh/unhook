'use client';

import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
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
import posthog from 'posthog-js';

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
    // Track the event deletion
    posthog.capture('events_deleted', {
      event_id: eventId,
      event_name: eventName,
    });

    deleteEvent.mutate({ id: eventId });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <MetricButton
          className="h-8 w-8 p-0"
          metric="delete_event_dialog_trigger_clicked"
          size="sm"
          variant="ghost"
        >
          <Trash2 className="size-4" />
        </MetricButton>
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
          <MetricButton
            disabled={deleteEvent.isPending}
            metric="delete_event_confirm_clicked"
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteEvent.isPending ? 'Deleting...' : 'Delete Event'}
          </MetricButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
