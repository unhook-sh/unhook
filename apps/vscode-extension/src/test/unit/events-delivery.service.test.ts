import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { WebhookConfig } from '@unhook/client/config';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import type { AnalyticsService } from '../../services/analytics.service';
import type { AuthStore } from '../../services/auth.service';
import { EventsDeliveryService } from '../../services/events-delivery.service';

// Mock the client utilities
const mockCreateRequestsForEventToAllDestinations = mock(() =>
  Promise.resolve(),
);
const mockHandlePendingRequest = mock(() => Promise.resolve());

mock.module('@unhook/client/utils/delivery', () => ({
  createRequestsForEventToAllDestinations:
    mockCreateRequestsForEventToAllDestinations,
  handlePendingRequest: mockHandlePendingRequest,
}));

// Mock analytics service
const mockAnalyticsService = {
  track: mock(() => {}),
  trackWebhookEvent: mock(() => {}),
};

// Mock auth store
const mockAuthStore = {
  api: {
    events: {
      updateEventStatus: {
        mutate: mock(() => Promise.resolve()),
      },
    },
    requests: {
      byEventId: {
        query: mock(() => Promise.resolve([])),
      },
      byWebhookId: {
        query: mock(() => Promise.resolve([])),
      },
    },
  },
  isSignedIn: true,
};

// Mock event data for testing
const mockEvent: EventTypeWithRequest = {
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
};

const mockConfig: WebhookConfig = {
  delivery: [
    {
      destination: 'local',
      source: '*',
    },
  ],
  destination: [
    {
      name: 'local',
      url: 'http://localhost:3000',
    },
  ],
  webhookId: 'wh_123',
};

describe('EventsDeliveryService', () => {
  beforeEach(() => {
    mockCreateRequestsForEventToAllDestinations.mockClear();
    mockHandlePendingRequest.mockClear();
    mockAnalyticsService.track.mockClear();
    mockAnalyticsService.trackWebhookEvent.mockClear();
    mockAuthStore.api.requests.byEventId.query.mockClear();
    mockAuthStore.api.requests.byWebhookId.query.mockClear();
    mockAuthStore.api.events.updateEventStatus.mutate.mockClear();
  });

  describe('handleRealtimeEventDelivery', () => {
    test('should handle realtime event delivery', async () => {
      const service = new EventsDeliveryService(
        mockAuthStore as unknown as AuthStore,
        mockAnalyticsService as unknown as AnalyticsService,
      );

      await service.handleRealtimeEventDelivery(mockEvent, mockConfig);

      expect(mockCreateRequestsForEventToAllDestinations).toHaveBeenCalledWith(
        expect.objectContaining({
          api: mockAuthStore.api,
          delivery: mockConfig.delivery,
          destination: mockConfig.destination,
          event: mockEvent,
        }),
      );
      expect(mockAnalyticsService.trackWebhookEvent).toHaveBeenCalledWith(
        'github',
        'webhook_delivered',
        expect.objectContaining({
          auto_delivery: true,
          destination_count: 1,
          event_id: 'event1',
          realtime: true,
        }),
      );
    });

    test('should work without analytics service', async () => {
      const service = new EventsDeliveryService(
        mockAuthStore as unknown as AuthStore,
        null,
      );

      await service.handleRealtimeEventDelivery(mockEvent, mockConfig);

      expect(mockCreateRequestsForEventToAllDestinations).toHaveBeenCalledWith(
        expect.objectContaining({
          api: mockAuthStore.api,
          delivery: mockConfig.delivery,
          destination: mockConfig.destination,
          event: mockEvent,
        }),
      );
    });

    test('should not deliver when auth store is null', async () => {
      const service = new EventsDeliveryService(
        null,
        mockAnalyticsService as unknown as AnalyticsService,
      );

      await service.handleRealtimeEventDelivery(mockEvent, mockConfig);

      expect(
        mockCreateRequestsForEventToAllDestinations,
      ).not.toHaveBeenCalled();
    });

    test('should handle events with no destinations', async () => {
      const service = new EventsDeliveryService(
        mockAuthStore as unknown as AuthStore,
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const configWithNoDestinations = { ...mockConfig, destination: [] };

      await service.handleRealtimeEventDelivery(
        mockEvent,
        configWithNoDestinations,
      );

      expect(mockCreateRequestsForEventToAllDestinations).toHaveBeenCalledWith(
        expect.objectContaining({
          api: mockAuthStore.api,
          delivery: configWithNoDestinations.delivery,
          destination: configWithNoDestinations.destination,
          event: mockEvent,
        }),
      );
      expect(mockAnalyticsService.trackWebhookEvent).toHaveBeenCalledWith(
        'github',
        'webhook_delivered',
        expect.objectContaining({
          auto_delivery: true,
          destination_count: 0,
          event_id: 'event1',
          realtime: true,
        }),
      );
    });
  });

  describe('handleNewEventsDelivery', () => {
    test('should handle new events delivery', async () => {
      const service = new EventsDeliveryService(
        mockAuthStore as unknown as AuthStore,
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [mockEvent];
      const newEvents = [
        { ...mockEvent, id: 'event2', status: 'pending' as const },
        { ...mockEvent, id: 'event3', status: 'pending' as const },
      ];

      await service.handleNewEventsDelivery(
        newEvents,
        previousEvents,
        mockConfig,
      );

      expect(mockCreateRequestsForEventToAllDestinations).toHaveBeenCalledTimes(
        2,
      );
      expect(mockAnalyticsService.trackWebhookEvent).toHaveBeenCalledTimes(2);
      expect(mockAnalyticsService.trackWebhookEvent).toHaveBeenCalledWith(
        'github',
        'webhook_delivered',
        expect.objectContaining({
          auto_delivery: true,
          destination_count: 1,
          event_id: 'event2',
        }),
      );
      expect(
        mockAuthStore.api.events.updateEventStatus.mutate,
      ).toHaveBeenCalledTimes(2);
    });

    test('should handle empty new events', async () => {
      const service = new EventsDeliveryService(
        mockAuthStore as unknown as AuthStore,
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [mockEvent];
      const newEvents: EventTypeWithRequest[] = [];

      await service.handleNewEventsDelivery(
        newEvents,
        previousEvents,
        mockConfig,
      );

      expect(
        mockCreateRequestsForEventToAllDestinations,
      ).not.toHaveBeenCalled();
      expect(mockAnalyticsService.trackWebhookEvent).not.toHaveBeenCalled();
    });

    test('should handle empty previous events', async () => {
      const service = new EventsDeliveryService(
        mockAuthStore as unknown as AuthStore,
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents: EventTypeWithRequest[] = [];
      const newEvents = [mockEvent];

      await service.handleNewEventsDelivery(
        newEvents,
        previousEvents,
        mockConfig,
      );

      // With the updated logic, we should process all new events regardless of status
      expect(mockCreateRequestsForEventToAllDestinations).toHaveBeenCalledTimes(
        1,
      );
      expect(mockAnalyticsService.trackWebhookEvent).toHaveBeenCalledTimes(1);
    });

    test('should handle events with different sources', async () => {
      const service = new EventsDeliveryService(
        mockAuthStore as unknown as AuthStore,
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [mockEvent];
      const newEvents = [
        {
          ...mockEvent,
          id: 'event2',
          source: 'stripe',
          status: 'pending' as const,
        },
        {
          ...mockEvent,
          id: 'event3',
          source: 'clerk',
          status: 'pending' as const,
        },
      ];

      await service.handleNewEventsDelivery(
        newEvents,
        previousEvents,
        mockConfig,
      );

      expect(mockCreateRequestsForEventToAllDestinations).toHaveBeenCalledTimes(
        2,
      );
      expect(mockAnalyticsService.trackWebhookEvent).toHaveBeenCalledTimes(2);
      expect(
        mockAuthStore.api.events.updateEventStatus.mutate,
      ).toHaveBeenCalledTimes(2);
    });

    test('should work without analytics service', async () => {
      const service = new EventsDeliveryService(
        mockAuthStore as unknown as AuthStore,
        null,
      );
      const previousEvents = [mockEvent];
      const newEvents = [
        { ...mockEvent, id: 'event2', status: 'pending' as const },
      ];

      await service.handleNewEventsDelivery(
        newEvents,
        previousEvents,
        mockConfig,
      );

      expect(mockCreateRequestsForEventToAllDestinations).toHaveBeenCalledTimes(
        1,
      );
    });

    test('should not deliver when auth store is null', async () => {
      const service = new EventsDeliveryService(
        null,
        mockAnalyticsService as unknown as AnalyticsService,
      );
      const previousEvents = [mockEvent];
      const newEvents = [
        { ...mockEvent, id: 'event2', status: 'pending' as const },
      ];

      await service.handleNewEventsDelivery(
        newEvents,
        previousEvents,
        mockConfig,
      );

      expect(
        mockCreateRequestsForEventToAllDestinations,
      ).not.toHaveBeenCalled();
    });
  });
});
