import { describe, expect, test } from 'bun:test';
import {
  constructEventFromRealtimeData,
  constructRequestFromRealtimeData,
} from '../providers/events-data.constructors';

describe('Events Data Constructors', () => {
  describe('constructEventFromRealtimeData', () => {
    test('should construct event from valid realtime data', () => {
      const realtimeData = {
        apiKeyId: 'key1',
        createdAt: '2024-01-01T10:00:00Z',
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
        retryCount: 0,
        source: 'github',
        status: 'completed',
        timestamp: '2024-01-01T10:00:00Z',
        updatedAt: null,
        userId: 'user1',
        webhookId: 'wh_123',
      };

      const result = constructEventFromRealtimeData(realtimeData);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('event1');
      expect(result?.source).toBe('github');
      expect(result?.status).toBe('completed');
      expect(result?.timestamp).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(result?.createdAt).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(result?.originRequest).toEqual(realtimeData.originRequest);
    });

    test('should handle invalid data gracefully', () => {
      const invalidData = {
        id: null,
        source: 'github',
        timestamp: 'invalid-date',
      };

      const result = constructEventFromRealtimeData(invalidData);

      // The function validates input and returns null for invalid data
      expect(result).toBeNull();
    });

    test('should handle missing optional fields', () => {
      const minimalData = {
        apiKeyId: 'key1',
        createdAt: '2024-01-01T10:00:00Z',
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
        retryCount: 0,
        source: 'github',
        status: 'pending',
        timestamp: '2024-01-01T10:00:00Z',
        updatedAt: null,
        userId: 'user1',
        webhookId: 'wh_123',
      };

      const result = constructEventFromRealtimeData(minimalData);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('event1');
      expect(result?.status).toBe('pending');
    });

    test('should handle failed events', () => {
      const failedEventData = {
        apiKeyId: 'key1',
        createdAt: '2024-01-01T10:00:00Z',
        failedReason: 'Network error',
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
        retryCount: 3,
        source: 'github',
        status: 'failed',
        timestamp: '2024-01-01T10:00:00Z',
        updatedAt: null,
        userId: 'user1',
        webhookId: 'wh_123',
      };

      const result = constructEventFromRealtimeData(failedEventData);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('failed');
      expect(result?.failedReason).toBe('Network error');
      expect(result?.retryCount).toBe(3);
    });

    test('should handle null/undefined data', () => {
      expect(constructEventFromRealtimeData(null)).toBeNull();
      expect(constructEventFromRealtimeData(undefined)).toBeNull();
      expect(constructEventFromRealtimeData({})).toBeNull();
    });
  });

  describe('constructRequestFromRealtimeData', () => {
    test('should construct request from valid realtime data', () => {
      const realtimeData = {
        apiKeyId: 'key1',
        completedAt: '2024-01-01T10:31:00Z',
        connectionId: null,
        createdAt: '2024-01-01T10:30:00Z',
        destination: { name: 'local', url: 'http://localhost:3000' },
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
        response: {
          body: '{}',
          headers: {},
          status: 200,
        },
        responseTimeMs: 1000,
        source: 'github',
        status: 'completed',
        timestamp: '2024-01-01T10:30:00Z',
        userId: 'user1',
        webhookId: 'wh_123',
      };

      const result = constructRequestFromRealtimeData(realtimeData);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('request1');
      expect(result?.status).toBe('completed');
      expect(result?.createdAt).toEqual(new Date('2024-01-01T10:30:00Z'));
      expect(result?.timestamp).toEqual(new Date('2024-01-01T10:30:00Z'));
      expect(result?.completedAt).toEqual(new Date('2024-01-01T10:31:00Z'));
      expect(result?.destination).toEqual({
        name: 'local',
        url: 'http://localhost:3000',
      });
      expect(result?.destinationName).toBe('local');
      expect(result?.destinationUrl).toBe('http://localhost:3000');
      expect(result?.request).toEqual(realtimeData.request);
      expect(result?.response).toEqual(realtimeData.response);
      expect(result?.responseTimeMs).toBe(1000);
    });

    test('should handle pending requests', () => {
      const pendingRequestData = {
        apiKeyId: 'key1',
        completedAt: null,
        connectionId: null,
        createdAt: '2024-01-01T10:30:00Z',
        destination: { name: 'local', url: 'http://localhost:3000' },
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
        response: null,
        responseTimeMs: 0,
        source: 'github',
        status: 'pending',
        timestamp: '2024-01-01T10:30:00Z',
        userId: 'user1',
        webhookId: 'wh_123',
      };

      const result = constructRequestFromRealtimeData(pendingRequestData);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('pending');
      expect(result?.completedAt).toBeNull();
      expect(result?.response).toBeNull();
      expect(result?.responseTimeMs).toBe(0);
    });

    test('should handle failed requests', () => {
      const failedRequestData = {
        apiKeyId: 'key1',
        completedAt: null,
        connectionId: null,
        createdAt: '2024-01-01T10:30:00Z',
        destination: { name: 'local', url: 'http://localhost:3000' },
        eventId: 'event1',
        failedReason: 'Network error',
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
        response: null,
        responseTimeMs: 0,
        source: 'github',
        status: 'failed',
        timestamp: '2024-01-01T10:30:00Z',
        userId: 'user1',
        webhookId: 'wh_123',
      };

      const result = constructRequestFromRealtimeData(failedRequestData);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('failed');
      expect(result?.failedReason).toBe('Network error');
      expect(result?.completedAt).toBeNull();
      expect(result?.response).toBeNull();
    });

    test('should handle missing destination data', () => {
      const dataWithoutDestination = {
        apiKeyId: 'key1',
        completedAt: '2024-01-01T10:31:00Z',
        connectionId: null,
        createdAt: '2024-01-01T10:30:00Z',
        destination: null,
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
        response: {
          body: '{}',
          headers: {},
          status: 200,
        },
        responseTimeMs: 1000,
        source: 'github',
        status: 'completed',
        timestamp: '2024-01-01T10:30:00Z',
        userId: 'user1',
        webhookId: 'wh_123',
      };

      const result = constructRequestFromRealtimeData(dataWithoutDestination);

      expect(result).toBeNull();
    });

    test('should handle invalid data', () => {
      const invalidData = {
        createdAt: 'invalid-date',
        destination: { name: 'local', url: 'http://localhost:3000' },
        id: null,
      };

      const result = constructRequestFromRealtimeData(invalidData);

      expect(result).toBeNull();
    });

    test('should handle null/undefined data', () => {
      expect(constructRequestFromRealtimeData(null)).toBeNull();
      expect(constructRequestFromRealtimeData(undefined)).toBeNull();
      expect(constructRequestFromRealtimeData({})).toBeNull();
    });

    test('should handle missing destination name/url', () => {
      const dataWithIncompleteDestination = {
        apiKeyId: 'key1',
        completedAt: '2024-01-01T10:31:00Z',
        connectionId: null,
        createdAt: '2024-01-01T10:30:00Z',
        destination: { name: null, url: 'http://localhost:3000' },
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
        response: {
          body: '{}',
          headers: {},
          status: 200,
        },
        responseTimeMs: 1000,
        source: 'github',
        status: 'completed',
        timestamp: '2024-01-01T10:30:00Z',
        userId: 'user1',
        webhookId: 'wh_123',
      };

      const result = constructRequestFromRealtimeData(
        dataWithIncompleteDestination,
      );

      expect(result).toBeNull();
    });
  });
});
