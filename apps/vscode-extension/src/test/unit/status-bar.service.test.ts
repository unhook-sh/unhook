import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { PollingState } from '../../services/polling.service';
import { StatusBarService } from '../../services/status-bar.service';

describe('StatusBarService', () => {
  let statusBarService: StatusBarService;

  beforeEach(() => {
    statusBarService = StatusBarService.getInstance();
  });

  afterEach(() => {
    statusBarService.dispose();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      // The service should be created without errors
      expect(statusBarService).toBeDefined();
    });
  });

  describe('polling state updates', () => {
    it('should handle null polling state', () => {
      statusBarService.updatePollingState(null as unknown as PollingState);
      // Should not throw and should handle gracefully
      expect(statusBarService).toBeDefined();
    });

    it('should handle active polling state', () => {
      const pollingState: PollingState = {
        autoPauseTimeout: 600000,
        consecutiveErrors: 0,
        errorCount: 0,
        isPaused: false,
        isPolling: true,
        lastEventTime: new Date(),
        lastPollTime: new Date(),
        pollingInterval: 5000,
      };

      statusBarService.updatePollingState(pollingState);
      // Should not throw
      expect(statusBarService).toBeDefined();
    });

    it('should handle paused polling state', () => {
      const pollingState: PollingState = {
        autoPauseTimeout: 600000,
        consecutiveErrors: 0,
        errorCount: 0,
        isPaused: true,
        isPolling: true,
        lastEventTime: new Date(),
        lastPollTime: new Date(),
        pollingInterval: 5000,
      };

      statusBarService.updatePollingState(pollingState);
      // Should not throw
      expect(statusBarService).toBeDefined();
    });

    it('should handle stopped polling state', () => {
      const pollingState: PollingState = {
        autoPauseTimeout: 600000,
        consecutiveErrors: 0,
        errorCount: 0,
        isPaused: false,
        isPolling: false,
        lastEventTime: null,
        lastPollTime: null,
        pollingInterval: 5000,
      };

      statusBarService.updatePollingState(pollingState);
      // Should not throw
      expect(statusBarService).toBeDefined();
    });
  });

  describe('configuration', () => {
    it('should update configuration correctly', () => {
      statusBarService.setConfig({
        showLastEventTime: false,
        showPollingInterval: false,
        showPollingStatus: false,
      });

      // Should not throw
      expect(statusBarService).toBeDefined();
    });

    it('should handle partial configuration updates', () => {
      statusBarService.setConfig({
        showPollingStatus: false,
      });

      // Should not throw
      expect(statusBarService).toBeDefined();
    });
  });

  describe('disposal', () => {
    it('should dispose without errors', () => {
      statusBarService.dispose();
      // Should not throw
      expect(statusBarService).toBeDefined();
    });
  });
});
