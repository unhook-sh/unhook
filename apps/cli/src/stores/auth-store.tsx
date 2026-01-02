import type { RouterOutputs } from '@unhook/api';
import { createClient } from '@unhook/api/client';
import { createId } from '@unhook/id';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import clipboard from 'clipboardy';
import { createStore } from 'zustand';
import { env } from '../env';
import { handleAuthError } from '../lib/auth/errors';
import { AuthServer } from '../lib/auth/server';
import { capture } from '../lib/posthog';
import { FileStorage } from '../lib/storage/file-storage';
import { SecureStorage } from '../lib/storage/secure-storage';
import type { StorageInterface } from '../lib/storage/storage-interface';
import { findAvailablePort } from '../utils/port';
import { useApiStore } from './api-store';

const log = debug('unhook:cli:auth-store');

export interface AuthState {
  isSignedIn: boolean;
  user: RouterOutputs['auth']['verifySessionToken']['user'] | null;
  orgId: string | null;
  authToken: string | null;
  sessionId: string;
  isValidatingSession: boolean;
  authUrl: string | null;
  isSigningIn: boolean;
  authServer: AuthServer | null;
  csrfToken: string | null;
  secureStorage: StorageInterface;
  fileStorage: StorageInterface;
}

interface AuthActions {
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  setSigningIn: (isSigningIn: boolean) => void;
  setAuthUrl: (authUrl: string | null) => void;
  reset: () => void;
  signIn: () => Promise<void>;
  exchangeAuthCode: (code: string) => Promise<{
    authToken: string;
    user: RouterOutputs['auth']['verifySessionToken']['user'];
    orgId: string;
    sessionId: string;
  }>;
  authenticateWithApiKey: (apiKey: string) => Promise<{
    authToken: string;
    user: RouterOutputs['auth']['verifySessionToken']['user'];
    orgId: string;
  }>;
}

type AuthStore = AuthState & AuthActions;

const defaultInitState: AuthState = {
  authServer: null,
  authToken: null,
  authUrl: null,
  csrfToken: null,
  fileStorage: new FileStorage({ namespace: 'auth' }),
  isSignedIn: false,
  isSigningIn: false,
  isValidatingSession: false,
  orgId: null,
  secureStorage:
    env.NEXT_PUBLIC_APP_ENV === 'development'
      ? new FileStorage({ namespace: 'auth' })
      : new SecureStorage({ namespace: 'auth' }),
  sessionId: createId({ prefix: 'session' }),
  user: null,
};
// Create and export the store instance
const store = createStore<AuthStore>()((set, get) => ({
  ...defaultInitState,

  authenticateWithApiKey: async (apiKey: string) => {
    set({ isValidatingSession: true });
    const state = get();

    log('Authenticating with API key');

    try {
      // Create API client with the provided API key/token
      const apiClient = createClient({
        authToken: apiKey,
        sessionCookie: apiKey,
        sourceHeader: 'cli',
      });

      useApiStore.setState({
        api: apiClient,
      });

      // Validate the API key by attempting to get org info
      // This will fail if the token is invalid
      const org = await apiClient.org.current.query();

      if (!org) {
        throw new Error('Failed to get organization information');
      }

      // Get user info
      const user = await apiClient.user.current.query();

      if (!user) {
        throw new Error('Failed to get user information');
      }

      // Store the token for future use
      await state.secureStorage.setItem('token', apiKey);

      // Map database user to the expected format
      const authUser: RouterOutputs['auth']['verifySessionToken']['user'] = {
        email: user.email,
        fullName:
          user.firstName || user.lastName
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : null,
        id: user.id,
      };

      set({
        authToken: apiKey,
        isSignedIn: true,
        isValidatingSession: false,
        orgId: org.id,
        user: authUser,
      });

      log('API key authentication completed successfully');
      capture({
        distinctId: user.id,
        event: 'user_authenticated',
        properties: {
          authMethod: 'api_key',
          email: user.email,
          orgId: org.id,
          userId: user.id,
        },
      });

      return {
        authToken: apiKey,
        orgId: org.id,
        user: authUser,
      };
    } catch (error) {
      log('Error authenticating with API key: %O', error);
      set({ isValidatingSession: false });
      handleAuthError(error);
      throw error;
    }
  },

  exchangeAuthCode: async (code: string) => {
    set({ isValidatingSession: true });
    const state = get();
    const { api } = useApiStore.getState();

    try {
      // Handle authentication
      const { authToken, user, orgId, sessionId } =
        await api.auth.exchangeAuthCode.mutate({
          code,
        });

      await state.secureStorage.setItem('token', authToken);
      await state.fileStorage.setItem('sessionId', sessionId);

      const apiClient = createClient({
        authToken: authToken,
        sessionCookie: authToken,
      });

      useApiStore.setState({
        api: apiClient,
      });

      set({
        authToken,
        isSignedIn: true,
        orgId,
        sessionId,
        user,
      });

      log('Authentication completed successfully');
      capture({
        distinctId: user.id,
        event: 'user_authenticated',
        properties: {
          email: user.email,
          orgId,
          userId: user.id,
        },
      });

      return {
        authToken,
        orgId,
        sessionId,
        user,
      };
    } catch (error) {
      handleAuthError(error);
    } finally {
      set({ isValidatingSession: false });
    }
  },

  logout: async () => {
    log('Clearing authentication state');
    const currentState = get();
    if (!currentState.isSignedIn && !currentState.user) {
      log('Auth state already cleared, skipping');
      get().reset();
      return;
    }

    if (currentState.user?.id) {
      log(
        'Logging out user: userId=%s, orgId=%s',
        currentState.user.id,
        currentState.orgId,
      );
      capture({
        event: 'user_logged_out',
        properties: {
          email: currentState.user?.email,
          orgId: currentState.orgId,
          sessionId: currentState.sessionId,
          userId: currentState.user?.id,
        },
      });
    }

    log('Resetting auth state: sessionId=%s', currentState.sessionId);

    try {
      await currentState.secureStorage.removeItem('token');
      await currentState.fileStorage.removeItem('sessionId');
    } catch (error) {
      log('Error removing token from storage: %O', error);
    } finally {
      get().reset();
      useApiStore.getState().reset();
    }
  },

  reset: () => {
    log('Resetting auth state');
    const currentState = get();
    currentState.authServer?.stop();

    set({
      ...defaultInitState,
      fileStorage: currentState.fileStorage, // Generate new session ID on reset
      secureStorage: currentState.secureStorage, // Preserve storage instance
      sessionId: createId({ prefix: 'session' }), // Preserve storage instance
    });
    capture({
      event: 'auth_state_reset',
    });
  },

  setAuthUrl: (authUrl: string | null) => {
    log('Setting auth URL:', authUrl);
    set({ authUrl });

    if (authUrl) {
      clipboard.writeSync(authUrl);
    }

    capture({
      event: 'auth_state_updated',
      properties: {
        hasAuthUrl: !!authUrl,
      },
    });
  },

  setSigningIn: (isSigningIn: boolean) => {
    log('Setting signing in state:', isSigningIn);
    set({ isSigningIn });
    capture({
      event: 'auth_state_updated',
      properties: {
        isSigningIn,
      },
    });
  },

  signIn: async () => {
    const state = get();

    if (state.isSigningIn || state.isSignedIn) {
      log('Authentication already in progress, skipping');
      return;
    }

    state.reset();

    log('Starting sign in');

    try {
      state.setSigningIn(true);
      const csrfToken = createId({ prefix: 'csrf' });
      const port = await findAvailablePort();
      const webAppUrl = env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const authUrl = new URL('/app/auth-code', webAppUrl);
      authUrl.searchParams.set('port', port.toString());
      authUrl.searchParams.set('csrf', csrfToken);
      authUrl.searchParams.set('source', 'cli');

      // Initialize auth server
      const authServer = new AuthServer();
      set({ authServer, csrfToken });

      // Store the auth URL
      state.setAuthUrl(authUrl.toString());
      log('Starting authentication flow with URL:', authUrl.toString());
      capture({
        event: 'auth_flow_started',
        properties: {
          clientPort: port,
        },
      });

      // Start local server to handle callback
      const authPromise = authServer.start({
        csrfToken,
        port,
      });

      // Wait for authentication response
      const result = await authPromise;
      log('Received authentication result');
      capture({
        event: 'auth_callback_received',
        properties: {
          hasCode: !!result.code,
        },
      });

      const exchangedAuthCode = await get().exchangeAuthCode(result.code);

      useApiStore.setState({
        api: createClient({
          authToken: exchangedAuthCode.authToken,
          sessionCookie: exchangedAuthCode.authToken,
        }),
      });

      set({
        authToken: null,
        authUrl: null,
        isSigningIn: false,
        isValidatingSession: false,
      });
    } catch (error) {
      handleAuthError(error);
    } finally {
      const currentState = get();
      currentState.authServer?.stop();
      set({ authServer: null, csrfToken: null });
    }
  },

  validateSession: async () => {
    set({ isValidatingSession: true });

    log('Validating token');

    try {
      const state = get();
      const storedToken = state.secureStorage
        ? await state.secureStorage.getItem('token')
        : null;

      const sessionId = state.fileStorage
        ? await state.fileStorage.getItem('sessionId')
        : null;

      if (!sessionId) {
        log('No session ID found');
        await get().logout();
        return false;
      }

      if (!storedToken) {
        log('No stored token found');
        await get().logout();
        return false;
      }

      const apiClient = createClient({
        authToken: storedToken,
        sessionCookie: storedToken,
      });

      useApiStore.setState({
        api: apiClient,
      });

      const token = await apiClient.auth.verifySessionToken.query({
        sessionId,
      });

      capture({
        event: 'session_validated',
        properties: {
          email: token.user.email,
          orgId: token.orgId,
          sessionId: get().sessionId,
          userId: token.user.id,
        },
      });

      // Use the fresh auth token for Supabase realtime connections
      const freshToken = token.authToken || storedToken;

      set({
        authToken: freshToken,
        isSignedIn: true,
        isValidatingSession: false,
        orgId: token.orgId,
        user: token.user,
      });

      // Update the API client with the fresh token
      useApiStore.setState({
        api: createClient({
          authToken: freshToken,
          sessionCookie: freshToken,
        }),
      });

      return true;
    } catch (error) {
      log('Error validating token: %O', error);
      await get().logout();
      return false;
    }
  },
}));

export const useAuthStore = createSelectors(store);
