import type { EventTypeWithRequest } from '@unhook/db/schema';
import { debug } from '@unhook/logger';

const log = debug('unhook:vscode:events-utils');

/**
 * Sort events by timestamp time in descending order (newest first)
 */
export function sortEventsByTimestamp(
  events: EventTypeWithRequest[],
): EventTypeWithRequest[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA; // Descending order (newest first)
  });
}

/**
 * Sort requests by createdAt time in descending order (newest first)
 */
export function sortRequestsByCreatedAt(
  requests: EventTypeWithRequest['requests'],
): EventTypeWithRequest['requests'] {
  if (!requests) return [];
  return [...requests].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descending order (newest first)
  });
}

/**
 * Sort events and their requests by createdAt time
 */
export function sortEventsAndRequests(
  events: EventTypeWithRequest[],
): EventTypeWithRequest[] {
  return sortEventsByTimestamp(events).map((event) => ({
    ...event,
    requests: sortRequestsByCreatedAt(event.requests ?? []),
  }));
}

/**
 * Filter events based on search text
 */
export function filterEvents(
  events: EventTypeWithRequest[],
  filterText: string,
): EventTypeWithRequest[] {
  if (!filterText) return events;

  return events.filter(
    (event) =>
      event.id.toLowerCase().includes(filterText) ||
      event.source.toLowerCase().includes(filterText) ||
      event.status.toLowerCase().includes(filterText) ||
      (event.failedReason?.toLowerCase().includes(filterText) ?? false) ||
      event.webhookId.toLowerCase().includes(filterText),
  );
}

/**
 * Filter out invalid events to prevent tree rendering errors
 */
export function filterValidEvents(
  events: EventTypeWithRequest[],
): EventTypeWithRequest[] {
  return events.filter((event) => {
    if (!event || typeof event !== 'object') {
      log('Filtering out invalid event:', event);
      return false;
    }
    if (!event.id) {
      log('Filtering out event with missing ID:', event);
      return false;
    }
    return true;
  });
}

/**
 * Filter out invalid requests to prevent tree rendering errors
 */
export function filterValidRequests(
  requests: EventTypeWithRequest['requests'],
): EventTypeWithRequest['requests'] {
  if (!requests) return [];

  return requests.filter((request) => {
    if (!request || typeof request !== 'object') {
      log('Filtering out invalid request:', request);
      return false;
    }
    if (!request.id || !request.destination) {
      log('Filtering out request with missing required fields:', {
        hasDestination: !!request.destination,
        id: request.id,
      });
      return false;
    }
    return true;
  });
}
