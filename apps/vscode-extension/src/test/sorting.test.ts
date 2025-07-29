import { describe, expect, test } from 'bun:test';

// Mock the types and classes we need for testing
type EventTypeWithRequest = {
  id: string;
  createdAt: Date;
  requests?: Array<{
    id: string;
    createdAt: Date;
  }>;
};

// Simple sorting functions for testing (copied from the actual implementation)
function sortEventsByCreatedAt(
  events: EventTypeWithRequest[],
): EventTypeWithRequest[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descending order (newest first)
  });
}

function sortRequestsByCreatedAt(
  requests: EventTypeWithRequest['requests'],
): EventTypeWithRequest['requests'] {
  if (!requests) return [];
  return [...requests].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descending order (newest first)
  });
}

function sortEventsAndRequests(
  events: EventTypeWithRequest[],
): EventTypeWithRequest[] {
  return sortEventsByCreatedAt(events).map((event) => ({
    ...event,
    requests: sortRequestsByCreatedAt(event.requests ?? []),
  }));
}

describe('Event and Request Sorting', () => {
  test('should sort events by createdAt in descending order (newest first)', () => {
    const events: EventTypeWithRequest[] = [
      {
        createdAt: new Date('2024-01-01T10:00:00Z'),
        id: 'event1',
      },
      {
        createdAt: new Date('2024-01-01T12:00:00Z'),
        id: 'event2',
      },
      {
        createdAt: new Date('2024-01-01T11:00:00Z'),
        id: 'event3',
      },
    ];

    const sortedEvents = sortEventsByCreatedAt(events);

    expect(sortedEvents[0]?.id).toBe('event2'); // 12:00 (newest)
    expect(sortedEvents[1]?.id).toBe('event3'); // 11:00
    expect(sortedEvents[2]?.id).toBe('event1'); // 10:00 (oldest)
  });

  test('should sort requests by createdAt in descending order (newest first)', () => {
    const requests = [
      {
        createdAt: new Date('2024-01-01T10:00:00Z'),
        id: 'request1',
      },
      {
        createdAt: new Date('2024-01-01T12:00:00Z'),
        id: 'request2',
      },
      {
        createdAt: new Date('2024-01-01T11:00:00Z'),
        id: 'request3',
      },
    ];

    const sortedRequests = sortRequestsByCreatedAt(requests);

    expect(sortedRequests?.[0]?.id).toBe('request2'); // 12:00 (newest)
    expect(sortedRequests?.[1]?.id).toBe('request3'); // 11:00
    expect(sortedRequests?.[2]?.id).toBe('request1'); // 10:00 (oldest)
  });

  test('should sort both events and their requests by createdAt', () => {
    const events: EventTypeWithRequest[] = [
      {
        createdAt: new Date('2024-01-01T10:00:00Z'),
        id: 'event1',
        requests: [
          {
            createdAt: new Date('2024-01-01T10:30:00Z'),
            id: 'request1-1',
          },
          {
            createdAt: new Date('2024-01-01T10:15:00Z'),
            id: 'request1-2',
          },
        ],
      },
      {
        createdAt: new Date('2024-01-01T12:00:00Z'),
        id: 'event2',
        requests: [
          {
            createdAt: new Date('2024-01-01T12:30:00Z'),
            id: 'request2-1',
          },
          {
            createdAt: new Date('2024-01-01T12:15:00Z'),
            id: 'request2-2',
          },
        ],
      },
    ];

    const sortedEventsAndRequests = sortEventsAndRequests(events);

    // Check event order
    expect(sortedEventsAndRequests?.[0]?.id).toBe('event2'); // 12:00 (newest event)
    expect(sortedEventsAndRequests?.[1]?.id).toBe('event1'); // 10:00 (oldest event)

    // Check request order within event2
    expect(sortedEventsAndRequests?.[0]?.requests?.[0]?.id).toBe('request2-1'); // 12:30 (newest request)
    expect(sortedEventsAndRequests?.[0]?.requests?.[1]?.id).toBe('request2-2'); // 12:15

    // Check request order within event1
    expect(sortedEventsAndRequests?.[1]?.requests?.[0]?.id).toBe('request1-1'); // 10:30 (newest request)
    expect(sortedEventsAndRequests?.[1]?.requests?.[1]?.id).toBe('request1-2'); // 10:15
  });

  test('should handle empty arrays', () => {
    const emptyEvents: EventTypeWithRequest[] = [];
    const emptyRequests: EventTypeWithRequest['requests'] = [];

    expect(sortEventsByCreatedAt(emptyEvents)).toEqual([]);
    expect(sortRequestsByCreatedAt(emptyRequests)).toEqual([]);
    expect(sortEventsAndRequests(emptyEvents)).toEqual([]);
  });

  test('should handle events with no requests', () => {
    const events: EventTypeWithRequest[] = [
      {
        createdAt: new Date('2024-01-01T10:00:00Z'),
        id: 'event1',
      },
      {
        createdAt: new Date('2024-01-01T12:00:00Z'),
        id: 'event2',
      },
    ];

    const sortedEvents = sortEventsAndRequests(events);

    expect(sortedEvents?.[0]?.id).toBe('event2'); // 12:00 (newest)
    expect(sortedEvents?.[1]?.id).toBe('event1'); // 10:00 (oldest)
    expect(sortedEvents?.[0]?.requests).toEqual([]);
    expect(sortedEvents?.[1]?.requests).toEqual([]);
  });
});
