import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import type { AnalyticsService } from '../../services/analytics.service';
import { EventsNotificationService } from '../../services/events-notification.service';

// Mock vscode functions
const mockShowInformationMessage = mock(() => Promise.resolve('OK'));
const mockShowWarningMessage = mock(() => Promise.resolve('OK'));

// Create a mock vscode object
const mockVscode = {
  window: {
    showInformationMessage: mockShowInformationMessage,
    showWarningMessage: mockShowWarningMessage,
  },
};

// Mock the vscode module if it's available, otherwise create a global mock
try {
  mock.module('vscode', () => mockVscode);
} catch (_error) {
  // If vscode module is not available (like in test environment),
  // we'll need to mock it differently
  (globalThis as Record<string, unknown>).vscode = mockVscode;
}

// Mock analytics service
const mockAnalyticsService = {
  track: mock(() => {}),
  trackWebhookEvent: mock(() => {}),
};

// Mock event data for testing
const mockEvents: EventTypeWithRequest[] = [
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
];

describe('EventsNotificationService', () => {
  beforeEach(() => {
    mockShowInformationMessage.mockClear();
    mockShowWarningMessage.mockClear();
    mockAnalyticsService.track.mockClear();
    mockAnalyticsService.trackWebhookEvent.mockClear();
  });

  describe('checkForNewEventsAndNotify', () => {
    test('should notify when new events are detected', () => {
      const service = new EventsNotificationService(
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [mockEvents[0]] as EventTypeWithRequest[]; // Contains event1 (github)
      const newEvents = [...mockEvents]; // Contains event1 (github) and event2 (stripe)

      service.checkForNewEventsAndNotify(newEvents, previousEvents);

      // Only event2 (stripe) is new
      expect(mockShowInformationMessage).toHaveBeenCalledWith(
        'New webhook event received: stripe',
      );
      expect(mockAnalyticsService.trackWebhookEvent).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.trackWebhookEvent).toHaveBeenCalledWith(
        'stripe',
        'webhook_received',
        expect.objectContaining({
          event_id: 'event2',
        }),
      );
    });

    test('should not notify when no new events are detected', () => {
      const service = new EventsNotificationService(
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [...mockEvents];
      const newEvents = [...mockEvents];

      service.checkForNewEventsAndNotify(newEvents, previousEvents);

      expect(mockShowInformationMessage).not.toHaveBeenCalled();
      expect(mockAnalyticsService.trackWebhookEvent).not.toHaveBeenCalled();
    });

    test('should not notify when previous events is empty', () => {
      const service = new EventsNotificationService(
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents: EventTypeWithRequest[] = [];
      const newEvents = [mockEvents[0]] as EventTypeWithRequest[];

      service.checkForNewEventsAndNotify(newEvents, previousEvents);

      expect(mockShowInformationMessage).not.toHaveBeenCalled();
    });

    test('should handle empty new events', () => {
      const service = new EventsNotificationService(
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [mockEvents[0]] as EventTypeWithRequest[];
      const newEvents: EventTypeWithRequest[] = [];

      service.checkForNewEventsAndNotify(newEvents, previousEvents);

      expect(mockShowInformationMessage).not.toHaveBeenCalled();
      expect(mockAnalyticsService.trackWebhookEvent).not.toHaveBeenCalled();
    });

    test('should show source in single event notification', () => {
      const service = new EventsNotificationService(
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [mockEvents[1]] as EventTypeWithRequest[]; // Has one event
      const newEvents = [
        mockEvents[0],
        mockEvents[1],
      ] as EventTypeWithRequest[]; // Add github event

      service.checkForNewEventsAndNotify(newEvents, previousEvents);

      expect(mockShowInformationMessage).toHaveBeenCalledWith(
        'New webhook event received: github',
      );
    });

    test('should handle events with different sources', () => {
      const service = new EventsNotificationService(
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [mockEvents[0]] as EventTypeWithRequest[]; // Need non-empty previous events
      const newEvents = [
        mockEvents[0], // Keep existing
        {
          ...(mockEvents[0] as EventTypeWithRequest),
          id: 'event2',
          source: 'clerk',
        },
        {
          ...(mockEvents[1] as EventTypeWithRequest),
          id: 'event3',
          source: 'custom',
        },
      ] as EventTypeWithRequest[];

      service.checkForNewEventsAndNotify(newEvents, previousEvents);

      expect(mockShowInformationMessage).toHaveBeenCalledWith(
        '2 new webhook events received',
      );
    });

    test('should work without analytics service', () => {
      const service = new EventsNotificationService(null);
      const previousEvents = [mockEvents[1]] as EventTypeWithRequest[]; // Need non-empty previous
      const newEvents = [
        mockEvents[0],
        mockEvents[1],
      ] as EventTypeWithRequest[];

      service.checkForNewEventsAndNotify(newEvents, previousEvents);

      expect(mockShowInformationMessage).toHaveBeenCalledWith(
        'New webhook event received: github',
      );
    });

    test('should handle single new event', () => {
      const service = new EventsNotificationService(
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [mockEvents[0]] as EventTypeWithRequest[];
      const newEvents = [
        mockEvents[0],
        mockEvents[1],
      ] as EventTypeWithRequest[];

      service.checkForNewEventsAndNotify(newEvents, previousEvents);

      expect(mockShowInformationMessage).toHaveBeenCalledWith(
        'New webhook event received: stripe',
      );
      expect(mockAnalyticsService.trackWebhookEvent).toHaveBeenCalledWith(
        'stripe',
        'webhook_received',
        expect.objectContaining({
          event_id: 'event2',
        }),
      );
    });

    test('should handle multiple new events from same source', () => {
      const service = new EventsNotificationService(
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [
        { ...(mockEvents[0] as EventTypeWithRequest), id: 'event0' },
      ];
      const newEvents = [
        { ...(mockEvents[0] as EventTypeWithRequest), id: 'event0' }, // Keep existing
        { ...(mockEvents[0] as EventTypeWithRequest), id: 'event1' },
        { ...(mockEvents[0] as EventTypeWithRequest), id: 'event2' },
        { ...(mockEvents[0] as EventTypeWithRequest), id: 'event3' },
      ] as EventTypeWithRequest[];

      service.checkForNewEventsAndNotify(newEvents, previousEvents);

      expect(mockShowInformationMessage).toHaveBeenCalledWith(
        '3 new webhook events received',
      );
      expect(mockAnalyticsService.trackWebhookEvent).toHaveBeenCalledTimes(3);
    });
  });
});
