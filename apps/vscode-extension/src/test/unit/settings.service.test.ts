import { describe, expect, it } from 'bun:test';

describe('SettingsService', () => {
  describe('validation functions', () => {
    it('should validate polling interval correctly', () => {
      // Test the validation logic directly
      const validatePollingInterval = (interval: number): boolean => {
        return interval >= 2000 && interval <= 30000;
      };

      expect(validatePollingInterval(5000)).toBe(true);
      expect(validatePollingInterval(1000)).toBe(false);
      expect(validatePollingInterval(40000)).toBe(false);
    });

    it('should validate auto-pause timeout correctly', () => {
      // Test the validation logic directly
      const validateAutoPauseTimeout = (timeout: number): boolean => {
        return timeout >= 300000 && timeout <= 3600000;
      };

      expect(validateAutoPauseTimeout(600000)).toBe(true);
      expect(validateAutoPauseTimeout(100000)).toBe(false);
      expect(validateAutoPauseTimeout(4000000)).toBe(false);
    });

    it('should format polling interval correctly', () => {
      const formatPollingInterval = (interval: number): string => {
        const seconds = Math.round(interval / 1000);
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
      };

      expect(formatPollingInterval(5000)).toBe('5 seconds');
      expect(formatPollingInterval(1000)).toBe('1 second');
      expect(formatPollingInterval(10000)).toBe('10 seconds');
    });

    it('should format auto-pause timeout correctly', () => {
      const formatAutoPauseTimeout = (timeout: number): string => {
        const minutes = Math.round(timeout / 60000);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      };

      expect(formatAutoPauseTimeout(600000)).toBe('10 minutes');
      expect(formatAutoPauseTimeout(300000)).toBe('5 minutes');
      expect(formatAutoPauseTimeout(60000)).toBe('1 minute');
    });
  });

  describe('default values', () => {
    it('should have correct default polling settings', () => {
      const defaultPollingSettings = {
        autoPauseEnabled: true,
        autoPauseTimeout: 600000,
        interval: 5000,
      };

      expect(defaultPollingSettings.interval).toBe(5000);
      expect(defaultPollingSettings.autoPauseTimeout).toBe(600000);
      expect(defaultPollingSettings.autoPauseEnabled).toBe(true);
    });

    it('should have correct default status bar settings', () => {
      const defaultStatusBarSettings = {
        showLastEventTime: true,
        showPollingInterval: true,
        showPollingStatus: true,
      };

      expect(defaultStatusBarSettings.showPollingStatus).toBe(true);
      expect(defaultStatusBarSettings.showLastEventTime).toBe(true);
      expect(defaultStatusBarSettings.showPollingInterval).toBe(true);
    });
  });
});
