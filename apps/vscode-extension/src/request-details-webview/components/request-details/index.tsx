'use client';

import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { NoDataFallback } from './no-data-fallback';
import { RequestProvider } from './request-context';
import { RequestHeader } from './request-header';
import { RequestTabs } from './request-tabs';

export interface RequestDetailsProps {
  data: RequestTypeWithEventType;
}

export function RequestDetails({ data }: RequestDetailsProps) {
  // Validate that we have the required data
  if (!data) {
    return <NoDataFallback />;
  }

  return (
    <RequestProvider request={data}>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <RequestHeader />

          {/* Tabs */}
          <RequestTabs />
        </div>
      </div>
    </RequestProvider>
  );
}
