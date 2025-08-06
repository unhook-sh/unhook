import '../setup';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import type { AuthStore } from '../../services/auth.service';
import {
  PollingService,
  type PollingState,
} from '../../services/polling.service';

describe('PollingService', () => {
  let pollingService: PollingService;
  let mockAuthStore: AuthStore;
  let mockOnStateChange: (state: PollingState) => void;
  let mockOnError: (error: Error) => void;
  let receivedEvents: EventTypeWithRequest[][] = [];

  beforeEach(() => {
    mockOnStateChange = () => {};
    mockOnError = () => {};
    receivedEvents = [];

    mockAuthStore = {
      api: {
        events: {
          byWebhookId: {
            query: async () => [] as EventTypeWithRequest[],
          },
        },
      },
      isSignedIn: true,
      onDidChangeAuth: () => {},
      sessionId: 'mock-session-123',
      supabaseToken: 'mock-token-123',
      validateSession: async () => {},
    } as unknown as AuthStore;

    pollingService = new PollingService({
      authStore: mockAuthStore,
      onError: mockOnError,
      onStateChange: mockOnStateChange,
    });

    // Subscribe to events for testing
    pollingService.onEventsReceived((events) => {
      receivedEvents.push(events);
    });
  });

  afterEach(() => {
    pollingService.dispose();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const state = pollingService.getState();
      expect(state.isPolling).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.lastEventTime).toBe(null);
      expect(state.pollingInterval).toBe(5000);
      expect(state.autoPauseTimeout).toBe(600000);
    });

    it('should not be polling initially', () => {
      expect(pollingService.isPolling()).toBe(false);
      expect(pollingService.isPaused()).toBe(false);
    });
  });

  describe('polling control', () => {
    it('should start polling when requested', () => {
      pollingService.startPolling('test-webhook');
      expect(pollingService.isPolling()).toBe(true);
      expect(pollingService.isPaused()).toBe(false);
    });

    it('should not start polling if user is not signed in', () => {
      mockAuthStore.setAuthToken({ token: 'test-token' });
      pollingService.startPolling('test-webhook');
      expect(pollingService.isPolling()).toBe(false);
    });

    it('should pause polling when requested', () => {
      pollingService.startPolling('test-webhook');
      pollingService.pausePolling();
      expect(pollingService.isPolling()).toBe(false);
      expect(pollingService.isPaused()).toBe(true);
    });

    it('should resume polling when requested', () => {
      pollingService.startPolling('test-webhook');
      pollingService.pausePolling();
      pollingService.resumePolling();
      expect(pollingService.isPolling()).toBe(true);
      expect(pollingService.isPaused()).toBe(false);
    });

    it('should stop polling completely', () => {
      pollingService.startPolling('test-webhook');
      pollingService.stopPolling();
      expect(pollingService.isPolling()).toBe(false);
      expect(pollingService.isPaused()).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should set polling interval correctly', () => {
      pollingService.setPollingInterval(10000);
      expect(pollingService.getPollingInterval()).toBe(10000);
    });

    it('should reject invalid polling intervals', () => {
      expect(() => pollingService.setPollingInterval(1000)).toThrow(
        'Polling interval must be between 2 and 30 seconds',
      );
      expect(() => pollingService.setPollingInterval(40000)).toThrow(
        'Polling interval must be between 2 and 30 seconds',
      );
    });

    it('should set auto-pause timeout correctly', () => {
      pollingService.setAutoPauseTimeout(300000);
      const state = pollingService.getState();
      expect(state.autoPauseTimeout).toBe(300000);
    });

    it('should reject invalid auto-pause timeouts', () => {
      expect(() => pollingService.setAutoPauseTimeout(100000)).toThrow(
        'Auto-pause timeout must be between 5 and 60 minutes',
      );
      expect(() => pollingService.setAutoPauseTimeout(4000000)).toThrow(
        'Auto-pause timeout must be between 5 and 60 minutes',
      );
    });
  });

  describe('state management', () => {
    it('should return last event time', () => {
      expect(pollingService.getLastEventTime()).toBe(null);
    });

    it('should provide current state', () => {
      const state = pollingService.getState();
      expect(state).toHaveProperty('isPolling');
      expect(state).toHaveProperty('isPaused');
      expect(state).toHaveProperty('lastEventTime');
      expect(state).toHaveProperty('pollingInterval');
      expect(state).toHaveProperty('autoPauseTimeout');
    });

    it('should emit state changes', () => {
      let stateChangeCount = 0;
      pollingService.subscribeToStateChange(() => {
        stateChangeCount++;
      });

      pollingService.startPolling('test-webhook');
      expect(stateChangeCount).toBeGreaterThan(0);
    });
  });

  describe('disposal', () => {
    it('should clean up resources on dispose', () => {
      pollingService.startPolling('test-webhook');
      pollingService.dispose();
      expect(pollingService.isPolling()).toBe(false);
      expect(pollingService.isPaused()).toBe(false);
    });
  });
});
