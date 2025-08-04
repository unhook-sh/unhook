import '../setup';
import { beforeEach, describe, expect, it } from 'bun:test';
import type * as vscode from 'vscode';
import { ConfigManager } from '../../config.manager';

describe('ConfigManager Integration Tests', () => {
  let configManager: ConfigManager;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    // Reset the singleton instance
    (ConfigManager as unknown as { instance?: ConfigManager }).instance =
      undefined;

    mockContext = {
      extensionMode: 1, // Production mode
      globalState: {
        get: () => undefined,
        update: () => Promise.resolve(),
      },
      secrets: {
        get: () => Promise.resolve(undefined),
        store: () => Promise.resolve(),
      },
      subscriptions: [],
      workspaceState: {
        get: () => undefined,
        update: () => Promise.resolve(),
      },
    } as unknown as vscode.ExtensionContext;
  });

  describe('Production Environment', () => {
    beforeEach(async () => {
      configManager = ConfigManager.getInstance(mockContext);
      await configManager.loadConfiguration();
    });

    it('should use production URLs by default', () => {
      expect(configManager.getApiUrl()).toBe('https://unhook.sh');
      expect(configManager.getDashboardUrl()).toBe('https://unhook.sh');
      expect(configManager.isDevelopment()).toBe(false);
      expect(configManager.isSelfHosted()).toBe(false);
    });

    it('should detect self-hosted configuration when URLs are different', () => {
      // This test verifies that the ConfigManager correctly identifies
      // when it's not using the default production URLs
      const apiUrl = configManager.getApiUrl();
      const dashboardUrl = configManager.getDashboardUrl();

      // In a real scenario, if these were different from the defaults,
      // isSelfHosted should return true
      if (
        apiUrl !== 'https://unhook.sh' ||
        dashboardUrl !== 'https://unhook.sh'
      ) {
        expect(configManager.isSelfHosted()).toBe(true);
      } else {
        expect(configManager.isSelfHosted()).toBe(false);
      }
    });
  });

  describe('Configuration Loading', () => {
    it('should handle missing config file gracefully', async () => {
      configManager = ConfigManager.getInstance(mockContext);
      await configManager.loadConfiguration();

      expect(configManager.isConfigured()).toBe(false);
      expect(configManager.hasConfigFile()).toBe(false);
    });

    it('should provide default analytics and API key settings', () => {
      configManager = ConfigManager.getInstance(mockContext);

      // Test that these methods don't throw and return expected types
      expect(typeof configManager.isAnalyticsEnabled()).toBe('boolean');
      expect(configManager.getApiKey()).toBe(null);
      expect(configManager.hasApiKey()).toBe(false);
    });
  });

  describe('URL Resolution', () => {
    it('should provide consistent API and dashboard URLs', () => {
      configManager = ConfigManager.getInstance(mockContext);

      const apiUrl = configManager.getApiUrl();
      const dashboardUrl = configManager.getDashboardUrl();

      // URLs should be valid
      expect(typeof apiUrl).toBe('string');
      expect(typeof dashboardUrl).toBe('string');
      expect(apiUrl.length).toBeGreaterThan(0);
      expect(dashboardUrl.length).toBeGreaterThan(0);

      // URLs should be consistent across calls
      expect(configManager.getApiUrl()).toBe(apiUrl);
      expect(configManager.getDashboardUrl()).toBe(dashboardUrl);
    });

    it('should handle configuration reload', async () => {
      configManager = ConfigManager.getInstance(mockContext);

      const originalApiUrl = configManager.getApiUrl();

      // Reload should not throw
      await expect(configManager.reload()).resolves.not.toThrow();

      // URLs should remain consistent after reload
      expect(configManager.getApiUrl()).toBe(originalApiUrl);
    });
  });

  describe('Development Mode Detection', () => {
    it('should correctly identify production mode', () => {
      configManager = ConfigManager.getInstance(mockContext);
      expect(configManager.isDevelopment()).toBe(false);
    });

    it('should provide consistent development mode detection', () => {
      configManager = ConfigManager.getInstance(mockContext);

      const isDev = configManager.isDevelopment();

      // Should be consistent across calls
      expect(configManager.isDevelopment()).toBe(isDev);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should store context when provided', () => {
      const instance = ConfigManager.getInstance(mockContext);
      expect(instance.context).toBe(mockContext);
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration loading gracefully', async () => {
      configManager = ConfigManager.getInstance(mockContext);

      // Should not throw when loading configuration
      await expect(configManager.loadConfiguration()).resolves.not.toThrow();
    });

    it('should handle reload gracefully', async () => {
      configManager = ConfigManager.getInstance(mockContext);

      // Should not throw when reloading
      await expect(configManager.reload()).resolves.not.toThrow();
    });
  });

  describe('Environment Variable Handling', () => {
    it('should work with default environment variables', () => {
      configManager = ConfigManager.getInstance(mockContext);

      // Should work with whatever environment variables are available
      const apiUrl = configManager.getApiUrl();
      const dashboardUrl = configManager.getDashboardUrl();

      expect(typeof apiUrl).toBe('string');
      expect(typeof dashboardUrl).toBe('string');
      expect(apiUrl.length).toBeGreaterThan(0);
      expect(dashboardUrl.length).toBeGreaterThan(0);
    });
  });
});
