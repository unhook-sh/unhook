import type {
  EventTypeWithRequest,
  RequestPayload,
  ResponsePayload,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';

const log = debug('unhook:vscode:events-data-constructors');

/**
 * Construct an EventTypeWithRequest from realtime data
 */
export function constructEventFromRealtimeData(
  record: Record<string, unknown> | null | undefined,
): EventTypeWithRequest | null {
  // Handle null/undefined/empty input
  if (!record || typeof record !== 'object' || !record.id) {
    return null;
  }

  try {
    // Log the realtime record to see what we're getting
    log('Constructing event from realtime data', {
      hasOriginRequest: !!record.originRequest,
      originRequestBody: record.originRequest
        ? (record.originRequest as Record<string, unknown>)?.body
        : 'NOT_FOUND',
      originRequestKeys: record.originRequest
        ? Object.keys(record.originRequest as object)
        : [],
      recordId: record.id,
    });

    // Parse the realtime record into an EventTypeWithRequest
    const event: EventTypeWithRequest = {
      apiKeyId: record.apiKeyId as string,
      createdAt: new Date(record.createdAt as string),
      failedReason: record.failedReason as string | null,
      id: record.id as string,
      maxRetries: record.maxRetries as number,
      orgId: record.orgId as string,
      originRequest: record.originRequest as RequestPayload,
      requests: [],
      retryCount: record.retryCount as number,
      source: record.source as string,
      status: record.status as
        | 'pending'
        | 'processing'
        | 'completed'
        | 'failed',
      timestamp: new Date(record.timestamp as string),
      updatedAt: record.updatedAt ? new Date(record.updatedAt as string) : null,
      userId: record.userId as string,
      webhookId: record.webhookId as string,
    };

    return event;
  } catch (error) {
    log('Failed to construct event from realtime data', { error, record });
    return null;
  }
}

/**
 * Construct a request from realtime data
 */
export function constructRequestFromRealtimeData(
  record: Record<string, unknown> | null | undefined,
): EventTypeWithRequest['requests'][0] | null {
  // Handle null/undefined/empty input
  if (!record || typeof record !== 'object' || !record.id) {
    return null;
  }

  // Validate destination
  const destination = record.destination as {
    name?: string;
    url?: string;
  } | null;
  if (!destination || !destination.name || !destination.url) {
    return null;
  }

  try {
    // Log the realtime record to see what we're getting
    log('Constructing request from realtime data', {
      hasRequest: !!record.request,
      hasResponse: !!record.response,
      recordId: record.id,
      requestBody: record.request
        ? (record.request as Record<string, unknown>)?.body
        : 'NOT_FOUND',
      requestKeys: record.request
        ? Object.keys(record.request as Record<string, unknown>)
        : [],
      responseKeys: record.response
        ? Object.keys(record.response as Record<string, unknown>)
        : [],
    });

    // Parse the realtime record into a request with proper date conversion
    const request: EventTypeWithRequest['requests'][0] = {
      apiKeyId: record.apiKeyId as string,
      completedAt: record.completedAt
        ? new Date(record.completedAt as string)
        : null,
      connectionId: record.connectionId as string | null,
      createdAt: new Date(record.createdAt as string),
      destination: destination as { name: string; url: string },
      destinationName: destination.name,
      destinationUrl: destination.url,
      eventId: record.eventId as string | null,
      failedReason: record.failedReason as string | null,
      id: record.id as string,
      orgId: record.orgId as string,
      response: record.response as ResponsePayload | null,
      responseTimeMs: record.responseTimeMs as number,
      source: record.source as string,
      status: record.status as 'pending' | 'completed' | 'failed',
      timestamp: new Date(record.timestamp as string),
      userId: record.userId as string,
      webhookId: record.webhookId as string,
    };

    return request;
  } catch (error) {
    log('Failed to construct request from realtime data', { error, record });
    return null;
  }
}
