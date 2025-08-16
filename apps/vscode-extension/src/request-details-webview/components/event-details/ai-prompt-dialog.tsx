'use client';

import type { EventTypeWithRequest } from '@unhook/db/schema';
import { AiPromptDialog as SharedAiPromptDialog } from '../shared/ai-prompt-dialog';

interface AiPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventTypeWithRequest;
}

export function AiPromptDialog({
  open,
  onOpenChange,
  event,
}: AiPromptDialogProps) {
  return (
    <SharedAiPromptDialog
      data={event}
      mode="event"
      onOpenChange={onOpenChange}
      open={open}
    />
  );
}
