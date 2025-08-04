import '../setup';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import * as vscode from 'vscode';
import { ConfigManager } from '../../config.manager';

// Mock the @unhook/client/config module
const mockFindUpConfig = mock(() => Promise.resolve<string | null>(null));
const mockLoadConfig = mock(() =>
  Promise.resolve({
    server: {
      apiUrl: 'http://localhost:3001',
      dashboardUrl: 'http://localhost:3001',
    },
  }),
);

// Mock the env module
const mockEnv = {
  NEXT_PUBLIC_API_URL: 'https://test-api.unhook.sh',
  NEXT_PUBLIC_APP_ENV: 'test',
  NEXT_PUBLIC_APP_URL: 'https://test-app.unhook.sh',
  NEXT_PUBLIC_VSCODE_EXTENSION_ID: 'unhook.unhook-vscode',
};

// Mock the modules
mock.module('@unhook/client/config', () => ({
  findUpConfig: mockFindUpConfig,
  loadConfig: mockLoadConfig,
}));

mock.module('../../env', () => ({
  env: mockEnv,
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockContext: vscode.ExtensionContext;
  let mockGetConfiguration: ReturnType<typeof mock>;

  beforeEach(() => {
    // Reset the singleton instance
    (ConfigManager as unknown as { instance?: ConfigManager }).instance =
      undefined;

    // Reset environment variables by setting them to undefined
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: undefined,
      writable: true,
    });
    Object.defineProperty(process.env, 'VSCODE_DEV', {
      value: undefined,
      writable: true,
    });

    // Mock vscode.env.appName to not include 'Extension Development Host'
    (vscode.env as { appName: string }).appName = 'Visual Studio Code';

    mockContext = {
      extensionMode: vscode.ExtensionMode.Production,
      globalState: {
        get: mock(),
        update: mock(),
      },
      secrets: {
        get: mock(),
        store: mock(),
      },
      subscriptions: [],
      workspaceState: {
        get: mock(),
        update: mock(),
      },
    } as unknown as vscode.ExtensionContext;

    // Mock vscode.workspace.getConfiguration
    mockGetConfiguration = mock(
      () =>
        ({
          get: mock(() => undefined),
          has: mock(() => false),
          inspect: mock(() => undefined),
          update: mock(),
        }) as vscode.WorkspaceConfiguration,
    );

    // Replace the vscode.workspace.getConfiguration function
    (
      vscode.workspace as unknown as {
        getConfiguration: typeof mockGetConfiguration;
      }
    ).getConfiguration = mockGetConfiguration;
  });

  describe('getInstance', () => {
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

  describe('isDevelopment', () => {
    it('should return false in production mode', () => {
      configManager = ConfigManager.getInstance();
      expect(configManager.isDevelopment()).toBe(false);
    });

    it('should return true when extension mode is development', () => {
      const devContext = {
        ...mockContext,
        extensionMode: vscode.ExtensionMode.Development,
      };
      configManager = ConfigManager.getInstance(devContext);
      expect(configManager.isDevelopment()).toBe(true);
    });

    it('should return true when running in Extension Development Host', () => {
      // Mock vscode.env.appName
      const originalAppName = vscode.env.appName;
      (vscode.env as { appName: string }).appName =
        'Extension Development Host';

      configManager = ConfigManager.getInstance();
      expect(configManager.isDevelopment()).toBe(true);

      // Restore original value
      (vscode.env as { appName: string }).appName = originalAppName;
    });

    it('should return true when NODE_ENV is development', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
      });

      configManager = ConfigManager.getInstance();
      expect(configManager.isDevelopment()).toBe(true);

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });

    it('should return true when VSCODE_DEV is true', () => {
      const originalEnv = process.env.VSCODE_DEV;
      process.env.VSCODE_DEV = 'true';

      configManager = ConfigManager.getInstance();
      expect(configManager.isDevelopment()).toBe(true);

      process.env.VSCODE_DEV = originalEnv;
    });
  });

  describe('URL resolution', () => {
    beforeEach(async () => {
      configManager = ConfigManager.getInstance(mockContext);
      await configManager.loadConfiguration();
    });

    it('should use environment variables for API and dashboard URLs in production', () => {
      expect(configManager.getApiUrl()).toBe('https://test-api.unhook.sh');
      expect(configManager.getDashboardUrl()).toBe(
        'https://test-app.unhook.sh',
      );
    });

    it('should use localhost URLs in development mode', async () => {
      const devContext = {
        ...mockContext,
        extensionMode: vscode.ExtensionMode.Development,
      };
      configManager = ConfigManager.getInstance(devContext);
      await configManager.loadConfiguration();

      expect(configManager.getApiUrl()).toBe('http://localhost:3000');
      expect(configManager.getDashboardUrl()).toBe('http://localhost:3000');
    });

    it('should fall back to production URLs when environment variables are empty', async () => {
      // Mock env with empty values
      mockEnv.NEXT_PUBLIC_API_URL = '';
      mockEnv.NEXT_PUBLIC_APP_URL = '';

      configManager = ConfigManager.getInstance(mockContext);
      await configManager.loadConfiguration();

      expect(configManager.getApiUrl()).toBe('https://unhook.sh');
      expect(configManager.getDashboardUrl()).toBe('https://unhook.sh');
    });

    it('should use VS Code settings when environment variables are not set', async () => {
      // Mock env with empty values
      mockEnv.NEXT_PUBLIC_API_URL = '';
      mockEnv.NEXT_PUBLIC_APP_URL = '';

      // Mock VS Code settings
      const mockGet = mock((key: string) => {
        if (key === 'apiUrl') return 'https://custom-api.unhook.sh';
        if (key === 'dashboardUrl') return 'https://custom-dashboard.unhook.sh';
        return undefined;
      });

      mockGetConfiguration.mockReturnValue({
        get: mockGet,
        has: mock(() => false),
        inspect: mock(() => undefined),
        update: mock(),
      } as vscode.WorkspaceConfiguration);

      configManager = ConfigManager.getInstance(mockContext);
      await configManager.loadConfiguration();

      expect(configManager.getApiUrl()).toBe('https://custom-api.unhook.sh');
      expect(configManager.getDashboardUrl()).toBe(
        'https://custom-dashboard.unhook.sh',
      );
    });

    it('should use config file URLs in development mode', async () => {
      const devContext = {
        ...mockContext,
        extensionMode: vscode.ExtensionMode.Development,
      };

      // Mock VS Code settings to return a config file path
      const mockGet = mock((key: string) => {
        if (key === 'configFilePath') return '/path/to/unhook.yml';
        return undefined;
      });

      mockGetConfiguration.mockReturnValue({
        get: mockGet,
        has: mock(() => false),
        inspect: mock(() => undefined),
        update: mock(),
      } as vscode.WorkspaceConfiguration);

      configManager = ConfigManager.getInstance(devContext);
      await configManager.loadConfiguration();

      expect(configManager.getApiUrl()).toBe('http://localhost:3001');
      expect(configManager.getDashboardUrl()).toBe('http://localhost:3001');
    });
  });

  describe('loadConfiguration', () => {
    it('should load configuration from config file when available', async () => {
      // Mock VS Code settings to return a config file path
      const mockGet = mock((key: string) => {
        if (key === 'configFilePath') return '/path/to/unhook.yml';
        return undefined;
      });

      mockGetConfiguration.mockReturnValue({
        get: mockGet,
        has: mock(() => false),
        inspect: mock(() => undefined),
        update: mock(),
      } as vscode.WorkspaceConfiguration);

      configManager = ConfigManager.getInstance(mockContext);
      await configManager.loadConfiguration();

      expect(configManager.isConfigured()).toBe(true);
      expect(configManager.hasConfigFile()).toBe(true);
    });

    it('should handle missing config file gracefully', async () => {
      mockFindUpConfig.mockResolvedValue(null);

      configManager = ConfigManager.getInstance(mockContext);
      await configManager.loadConfiguration();

      expect(configManager.isConfigured()).toBe(false);
      expect(configManager.hasConfigFile()).toBe(false);
    });

    it('should search for config file in workspace folders', async () => {
      mockFindUpConfig
        .mockResolvedValueOnce(null) // First call returns null
        .mockResolvedValueOnce('/path/to/unhook.yml'); // Second call returns config

      // Mock workspace folders
      const mockWorkspaceFolders = [
        { uri: { fsPath: '/workspace1' } },
        { uri: { fsPath: '/workspace2' } },
      ];
      (
        vscode.workspace as { workspaceFolders?: typeof mockWorkspaceFolders }
      ).workspaceFolders = mockWorkspaceFolders;

      configManager = ConfigManager.getInstance(mockContext);
      await configManager.loadConfiguration();

      expect(mockFindUpConfig).toHaveBeenCalledWith({ cwd: '/workspace1' });
      expect(mockFindUpConfig).toHaveBeenCalledWith({ cwd: '/workspace2' });
    });
  });

  describe('isSelfHosted', () => {
    it('should return true when API URL is not the default production URL', async () => {
      // Set a custom API URL that's not the default
      mockEnv.NEXT_PUBLIC_API_URL = 'https://custom-api.unhook.sh';

      configManager = ConfigManager.getInstance(mockContext);
      await configManager.loadConfiguration();

      expect(configManager.isSelfHosted()).toBe(true);
    });

    it('should return false when API URL is the default production URL', async () => {
      mockEnv.NEXT_PUBLIC_API_URL = 'https://unhook.sh';

      configManager = ConfigManager.getInstance(mockContext);
      await configManager.loadConfiguration();

      expect(configManager.isSelfHosted()).toBe(false);
    });
  });

  describe('analytics and API key settings', () => {
    it('should read analytics setting from VS Code configuration', () => {
      const mockGet = mock((key: string) => {
        if (key === 'analytics.enabled') return true;
        return undefined;
      });

      mockGetConfiguration.mockReturnValue({
        get: mockGet,
        has: mock(() => false),
        inspect: mock(() => undefined),
        update: mock(),
      } as vscode.WorkspaceConfiguration);

      configManager = ConfigManager.getInstance(mockContext);
      expect(configManager.isAnalyticsEnabled()).toBe(true);
    });

    it('should read API key from VS Code configuration', () => {
      const mockGet = mock((key: string) => {
        if (key === 'apiKey') return 'test-api-key';
        return undefined;
      });

      mockGetConfiguration.mockReturnValue({
        get: mockGet,
        has: mock(() => false),
        inspect: mock(() => undefined),
        update: mock(),
      } as vscode.WorkspaceConfiguration);

      configManager = ConfigManager.getInstance(mockContext);
      expect(configManager.getApiKey()).toBe('test-api-key');
      expect(configManager.hasApiKey()).toBe(true);
    });

    it('should return null for API key when not set', () => {
      const mockGet = mock(() => '');

      mockGetConfiguration.mockReturnValue({
        get: mockGet,
        has: mock(() => false),
        inspect: mock(() => undefined),
        update: mock(),
      } as vscode.WorkspaceConfiguration);

      configManager = ConfigManager.getInstance(mockContext);
      expect(configManager.getApiKey()).toBe(null);
      expect(configManager.hasApiKey()).toBe(false);
    });
  });

  describe('reload', () => {
    it('should reload configuration when called', async () => {
      mockFindUpConfig.mockResolvedValue('/path/to/unhook.yml');

      // Mock workspace folders
      const mockWorkspaceFolders = [{ uri: { fsPath: '/workspace' } }];
      (
        vscode.workspace as { workspaceFolders?: typeof mockWorkspaceFolders }
      ).workspaceFolders = mockWorkspaceFolders;

      configManager = ConfigManager.getInstance(mockContext);
      await configManager.reload();

      expect(mockFindUpConfig).toHaveBeenCalledWith({ cwd: '/workspace' });
    });
  });
});
