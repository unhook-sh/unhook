'use client';

import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { createContext, useContext } from 'react';

interface EventContextValue {
  event: EventTypeWithRequest;
  eventName: string;
  headers: Record<string, string>;
  payload: string;
  source: string;
  timestamp: string;
  isRetry: boolean;
  retryAttempt: number;
}

const EventContext = createContext<EventContextValue | null>(null);

interface EventProviderProps {
  children: React.ReactNode;
  event: EventTypeWithRequest;
}

export function EventProvider({ children, event }: EventProviderProps) {
  // Extract data from the actual event
  const headers = event.originRequest?.headers || {};
  const payload = event.originRequest?.body || '';
  const source = event.source || 'Unknown';
  const timestamp = event.timestamp
    ? new Date(event.timestamp).toISOString()
    : new Date().toISOString();
  const isRetry = event.retryCount > 0;
  const retryAttempt = event.retryCount || 0;

  // Extract event name from payload
  const eventName = extractEventName(payload) || 'Unknown event';

  const value: EventContextValue = {
    event,
    eventName,
    headers,
    isRetry,
    payload,
    retryAttempt,
    source,
    timestamp,
  };

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}
