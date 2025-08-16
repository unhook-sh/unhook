'use client';

import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { createContext, useContext } from 'react';

interface RequestContextValue {
  request: RequestTypeWithEventType;
  event: RequestTypeWithEventType['event'];
  headers: Record<string, string>;
  responseHeaders: Record<string, string>;
  payload: string;
  responseBody: string;
  source: string;
  timestamp: string;
  completedAt: string;
  responseTime: number;
  status: string;
  isCompleted: boolean;
  isFailed: boolean;
  isPending: boolean;
}

const RequestContext = createContext<RequestContextValue | null>(null);

interface RequestProviderProps {
  children: React.ReactNode;
  request: RequestTypeWithEventType;
}

export function RequestProvider({ children, request }: RequestProviderProps) {
  // Extract data from the request
  const headers = request.event?.originRequest?.headers || {};
  const responseHeaders = request.response?.headers || {};
  const payload = request.event?.originRequest?.body || '';
  const responseBody = request.response?.body || '';
  const source = request.source || 'Unknown';
  const timestamp = request.timestamp
    ? new Date(request.timestamp).toISOString()
    : new Date().toISOString();
  const completedAt = request.completedAt
    ? new Date(request.completedAt).toISOString()
    : '';
  const responseTime = request.responseTimeMs || 0;
  const status = request.status;
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isPending = status === 'pending';

  const value: RequestContextValue = {
    completedAt,
    event: request.event,
    headers,
    isCompleted,
    isFailed,
    isPending,
    payload,
    request,
    responseBody,
    responseHeaders,
    responseTime,
    source,
    status,
    timestamp,
  };

  return (
    <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
  );
}

export function useRequest() {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error('useRequest must be used within a RequestProvider');
  }
  return context;
}
