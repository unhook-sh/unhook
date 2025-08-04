import '../setup';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ExtensionContext } from 'vscode';
import { UnhookAuthProvider } from '../../providers/auth.provider';
import type { AuthStore } from '../../services/auth.service';

// Mock VS Code
const mockVscode = {
  authentication: {
    registerAuthenticationProvider: mock(() => ({ dispose: mock() })),
  },
  EventEmitter: mock(() => ({
    dispose: mock(),
    event: {},
    fire: mock(),
  })),
  env: {
    openExternal: mock(),
  },
  window: {
    showErrorMessage: mock(),
    showInformationMessage: mock(),
    showWarningMessage: mock(),
  },
};

// Mock the vscode module
vi.mock('vscode', () => mockVscode);

// Mock the auth store
const mockAuthStore = {
  authToken: 'test-token',
  isSignedIn: true,
  onDidChangeAuth: { event: {} },
  sessionId: 'test-session-id',
  signOut: mock(),
  user: { email: 'test@example.com', id: 'test-user-id' },
} as unknown as AuthStore;

describe('UnhookAuthProvider', () => {
  let provider: UnhookAuthProvider;
  let mockContext: ExtensionContext;

  beforeEach(() => {
    mockContext = {
      globalState: {
        get: mock(),
        keys: mock(),
        setKeysForSync: mock(),
        update: mock(),
      },
      secrets: {
        delete: mock(),
        get: mock(),
        onDidChange: mock(),
        store: mock(),
      },
      subscriptions: [],
      workspaceState: {
        get: mock(),
        keys: mock(),
        update: mock(),
      },
    } as unknown as ExtensionContext;
    provider = new UnhookAuthProvider(mockContext, mockAuthStore);
  });

  describe('removeSession', () => {
    it('should always call authStore.signOut() even when getSession fails', async () => {
      // Mock getSession to throw an error (simulating validation failure)
      vi.spyOn(provider, 'getSession').mockRejectedValue(
        new Error('Session validation failed'),
      );

      // Call removeSession
      await provider.removeSession('test-session-id');

      // Verify that signOut was called
      expect(mockAuthStore.signOut).toHaveBeenCalled();
    });

    it('should construct session from stored data when getSession returns undefined', async () => {
      // Mock getSession to return undefined
      vi.spyOn(provider, 'getSession').mockResolvedValue(undefined);

      // Mock the _onDidChangeSessions fire method
      const fireSpy = vi.spyOn(provider, 'onDidChangeSessions');

      // Call removeSession
      await provider.removeSession('test-session-id');

      // Verify that signOut was called
      expect(mockAuthStore.signOut).toHaveBeenCalled();

      // Verify that the session change event was fired with a constructed session
      expect(fireSpy).toHaveBeenCalledWith({
        added: [],
        changed: [],
        removed: [
          {
            accessToken: 'test-token',
            account: {
              id: 'test-user-id',
              label: 'test@example.com',
            },
            id: 'test-session-id',
            scopes: ['openid', 'email', 'profile'],
          },
        ],
      });
    });

    it('should fire session change event even when no session data is available', async () => {
      // Mock auth store to have no session data
      const mockAuthStoreNoSession = {
        ...mockAuthStore,
        authToken: null,
        sessionId: null,
        user: null,
      } as unknown as AuthStore;

      const providerNoSession = new UnhookAuthProvider(
        mockContext,
        mockAuthStoreNoSession,
      );

      // Mock getSession to return undefined
      vi.spyOn(providerNoSession, 'getSession').mockResolvedValue(undefined);

      // Mock the _onDidChangeSessions fire method
      const fireSpy = vi.spyOn(providerNoSession, 'onDidChangeSessions');

      // Call removeSession
      await providerNoSession.removeSession('test-session-id');

      // Verify that signOut was called
      expect(mockAuthStoreNoSession.signOut).toHaveBeenCalled();

      // Verify that the session change event was fired with empty arrays
      expect(fireSpy).toHaveBeenCalledWith({
        added: [],
        changed: [],
        removed: [],
      });
    });
  });
});
