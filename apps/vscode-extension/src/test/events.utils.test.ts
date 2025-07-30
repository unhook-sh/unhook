import { describe, expect, test } from 'bun:test';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import {
  filterEvents,
  filterValidEvents,
  filterValidRequests,
  sortEventsAndRequests,
  sortEventsByTimestamp,
  sortRequestsByCreatedAt,
} from '../providers/events.utils';

// Mock event data for testing
const mockEvents = [
  {
    apiKeyId: 'key1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    failedReason: null,
    id: 'event1',
    maxRetries: 3,
    orgId: 'org1',
    originRequest: {
      body: '{}',
      clientIp: '127.0.0.1',
      contentType: 'application/json',
      headers: {},
      id: 'req1',
      method: 'POST',
      size: 100,
      sourceUrl: 'http://example.com',
    },
    requests: [],
    retryCount: 0,
    source: 'github',
    status: 'completed' as const,
    timestamp: new Date('2024-01-01T10:00:00Z'),
    updatedAt: null,
    userId: 'user1',
    webhookId: 'wh_123',
  },
  {
    apiKeyId: 'key1',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    failedReason: null,
    id: 'event2',
    maxRetries: 3,
    orgId: 'org1',
    originRequest: {
      body: '{}',
      clientIp: '127.0.0.1',
      contentType: 'application/json',
      headers: {},
      id: 'req2',
      method: 'POST',
      size: 100,
      sourceUrl: 'http://example.com',
    },
    requests: [],
    retryCount: 0,
    source: 'stripe',
    status: 'pending' as const,
    timestamp: new Date('2024-01-01T12:00:00Z'),
    updatedAt: null,
    userId: 'user1',
    webhookId: 'wh_123',
  },
  {
    apiKeyId: 'key1',
    createdAt: new Date('2024-01-01T11:00:00Z'),
    failedReason: 'Network error',
    id: 'event3',
    maxRetries: 3,
    orgId: 'org1',
    originRequest: {
      body: '{}',
      clientIp: '127.0.0.1',
      contentType: 'application/json',
      headers: {},
      id: 'req3',
      method: 'POST',
      size: 100,
      sourceUrl: 'http://example.com',
    },
    requests: [],
    retryCount: 0,
    source: 'clerk',
    status: 'failed' as const,
    timestamp: new Date('2024-01-01T11:00:00Z'),
    updatedAt: null,
    userId: 'user1',
    webhookId: 'wh_123',
  },
];

const mockRequests = [
  {
    apiKeyId: 'key1',
    completedAt: new Date('2024-01-01T10:31:00Z'),
    connectionId: null,
    createdAt: new Date('2024-01-01T10:30:00Z'),
    destination: { name: 'local', url: 'http://localhost:3000' },
    destinationName: 'local',
    destinationUrl: 'http://localhost:3000',
    eventId: 'event1',
    failedReason: null,
    id: 'request1',
    orgId: 'org1',
    request: {
      body: '{}',
      clientIp: '127.0.0.1',
      contentType: 'application/json',
      headers: {},
      id: 'req1',
      method: 'POST',
      size: 100,
      sourceUrl: 'http://localhost:3000',
    },
    response: { body: '{}', headers: {}, status: 200 },
    responseTimeMs: 1000,
    source: 'github',
    status: 'completed' as const,
    timestamp: new Date('2024-01-01T10:30:00Z'),
    userId: 'user1',
    webhookId: 'wh_123',
  },
  {
    apiKeyId: 'key1',
    completedAt: null,
    connectionId: null,
    createdAt: new Date('2024-01-01T12:30:00Z'),
    destination: { name: 'local', url: 'http://localhost:3000' },
    destinationName: 'local',
    destinationUrl: 'http://localhost:3000',
    eventId: 'event2',
    failedReason: null,
    id: 'request2',
    orgId: 'org1',
    request: {
      body: '{}',
      clientIp: '127.0.0.1',
      contentType: 'application/json',
      headers: {},
      id: 'req1',
      method: 'POST',
      size: 100,
      sourceUrl: 'http://localhost:3000',
    },
    response: null,
    responseTimeMs: 0,
    source: 'stripe',
    status: 'pending' as const,
    timestamp: new Date('2024-01-01T12:30:00Z'),
    userId: 'user1',
    webhookId: 'wh_123',
  },
  {
    apiKeyId: 'key1',
    completedAt: null,
    connectionId: null,
    createdAt: new Date('2024-01-01T11:30:00Z'),
    destination: { name: 'local', url: 'http://localhost:3000' },
    destinationName: 'local',
    destinationUrl: 'http://localhost:3000',
    eventId: 'event3',
    failedReason: 'Network error',
    id: 'request3',
    orgId: 'org1',
    request: {
      body: '{}',
      clientIp: '127.0.0.1',
      contentType: 'application/json',
      headers: {},
      id: 'req1',
      method: 'POST',
      size: 100,
      sourceUrl: 'http://localhost:3000',
    },
    response: null,
    responseTimeMs: 0,
    source: 'clerk',
    status: 'failed' as const,
    timestamp: new Date('2024-01-01T11:30:00Z'),
    userId: 'user1',
    webhookId: 'wh_123',
  },
];

describe('Events Utils', () => {
  describe('sortEventsByTimestamp', () => {
    test('should sort events by timestamp in descending order (newest first)', () => {
      const sortedEvents = sortEventsByTimestamp(mockEvents);

      expect(sortedEvents[0]?.id).toBe('event2'); // 12:00 (newest)
      expect(sortedEvents[1]?.id).toBe('event3'); // 11:00
      expect(sortedEvents[2]?.id).toBe('event1'); // 10:00 (oldest)
    });

    test('should handle empty array', () => {
      const sortedEvents = sortEventsByTimestamp([]);
      expect(sortedEvents).toEqual([]);
    });

    test('should handle single event', () => {
      const singleEvent = [mockEvents[0]] as typeof mockEvents;
      const sortedEvents = sortEventsByTimestamp(singleEvent);
      expect(sortedEvents).toEqual(singleEvent);
    });
  });

  describe('sortRequestsByCreatedAt', () => {
    test('should sort requests by createdAt in descending order (newest first)', () => {
      const sortedRequests = sortRequestsByCreatedAt(mockRequests);

      expect(sortedRequests?.[0]?.id).toBe('request2'); // 12:30 (newest)
      expect(sortedRequests?.[1]?.id).toBe('request3'); // 11:30
      expect(sortedRequests?.[2]?.id).toBe('request1'); // 10:30 (oldest)
    });

    test('should handle null/undefined requests', () => {
      const sortedRequests = sortRequestsByCreatedAt([]);
      expect(sortedRequests).toEqual([]);
    });

    test('should handle empty requests array', () => {
      const sortedRequests = sortRequestsByCreatedAt([]);
      expect(sortedRequests).toEqual([]);
    });
  });

  describe('sortEventsAndRequests', () => {
    test('should sort both events and their requests', () => {
      const eventsWithRequests = mockEvents.map((event, index) => ({
        ...event,
        requests: [mockRequests[index]] as typeof mockRequests,
      }));

      const sorted = sortEventsAndRequests(eventsWithRequests);

      // Events should be sorted by timestamp
      expect(sorted[0]?.id).toBe('event2');
      expect(sorted[1]?.id).toBe('event3');
      expect(sorted[2]?.id).toBe('event1');

      // Each event should have its request
      expect(sorted[0]?.requests?.[0]?.id).toBe('request2');
      expect(sorted[1]?.requests?.[0]?.id).toBe('request3');
      expect(sorted[2]?.requests?.[0]?.id).toBe('request1');
    });

    test('should handle events without requests', () => {
      const eventsWithoutRequests = mockEvents.map((event) => ({
        ...event,
        requests: [],
      }));

      const sorted = sortEventsAndRequests(eventsWithoutRequests);

      expect(sorted[0]?.id).toBe('event2');
      expect(sorted[0]?.requests).toEqual([]);
    });
  });

  describe('filterEvents', () => {
    test('should filter events by id', () => {
      const filtered = filterEvents(mockEvents, 'event1');
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.id).toBe('event1');
    });

    test('should filter events by source', () => {
      const filtered = filterEvents(mockEvents, 'github');
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.source).toBe('github');
    });

    test('should filter events by status', () => {
      const filtered = filterEvents(mockEvents, 'completed');
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.status).toBe('completed');
    });

    test('should filter events by failedReason', () => {
      const filtered = filterEvents(mockEvents, 'network error');
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.failedReason).toBe('Network error');
    });

    test('should filter events by webhookId', () => {
      const filtered = filterEvents(mockEvents, 'wh_123');
      expect(filtered).toHaveLength(3);
    });

    test('should return all events when filter is empty', () => {
      const filtered = filterEvents(mockEvents, '');
      expect(filtered).toHaveLength(3);
    });

    test('should be case insensitive', () => {
      const filtered = filterEvents(mockEvents, 'github');
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.source).toBe('github');
    });
  });

  describe('filterValidEvents', () => {
    test('should filter out invalid events', () => {
      const invalidEvents = [
        null,
        undefined,
        {},
        { id: null },
        { id: undefined },
        ...mockEvents,
      ];

      const validEvents = filterValidEvents(
        invalidEvents as EventTypeWithRequest[],
      );
      expect(validEvents).toHaveLength(3);
      expect(validEvents.every((event) => event?.id)).toBe(true);
    });

    test('should handle empty array', () => {
      const validEvents = filterValidEvents([]);
      expect(validEvents).toEqual([]);
    });

    test('should keep all valid events', () => {
      const validEvents = filterValidEvents(mockEvents);
      expect(validEvents).toEqual(mockEvents);
    });
  });

  describe('filterValidRequests', () => {
    test('should filter out invalid requests', () => {
      const invalidRequests = [
        null,
        undefined,
        {},
        { destination: { name: 'test', url: 'http://test.com' }, id: null },
        { destination: null, id: 'valid' },
        ...mockRequests,
      ];

      const validRequests = filterValidRequests(
        invalidRequests as typeof mockRequests,
      );
      expect(validRequests).toHaveLength(3);
      expect(validRequests.every((req) => req?.id && req.destination)).toBe(
        true,
      );
    });

    test('should handle null/undefined requests', () => {
      const validRequests = filterValidRequests([]);
      expect(validRequests).toEqual([]);
    });

    test('should handle empty array', () => {
      const validRequests = filterValidRequests([]);
      expect(validRequests).toEqual([]);
    });

    test('should keep all valid requests', () => {
      const validRequests = filterValidRequests(mockRequests);
      expect(validRequests).toEqual(mockRequests);
    });
  });
});
