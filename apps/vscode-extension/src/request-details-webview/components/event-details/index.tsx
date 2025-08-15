'use client';

import type { EventTypeWithRequest } from '@unhook/db/schema';
import { useState } from 'react';
import { AiPromptDialog } from './ai-prompt-dialog';
import { EventProvider } from './event-context';
import { EventHeader } from './event-header';
import { EventTabs } from './event-tabs';
import { NoDataFallback } from './no-data-fallback';

export interface EventDetailsProps {
  data: EventTypeWithRequest;
}

export function EventDetails({ data }: EventDetailsProps) {
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  // Validate that we have the required data
  if (!data) {
    return <NoDataFallback />;
  }

  return (
    <EventProvider event={data}>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <EventHeader onShowAiPrompt={() => setShowAiPrompt(true)} />

          {/* AI Prompt Dialog */}
          <AiPromptDialog onOpenChange={setShowAiPrompt} open={showAiPrompt} />

          {/* Tabs */}
          <EventTabs />
        </div>
      </div>
    </EventProvider>
  );
}
