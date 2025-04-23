import type { UserResource } from '@clerk/types';
import { createId } from '@unhook/id';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import jwt from 'jsonwebtoken';
import { createStore } from 'zustand';
import { SecureStorage } from '../lib/auth/secure-storage';
import { capture } from '../lib/posthog';

const log = debug('unhook:cli:auth-store');
const secureStorage = new SecureStorage('auth');

interface AuthState {
  isAuthenticated: boolean;
  user: UserResource | null;
  orgId: string | null;
  isLoading: boolean;
  sessionId: string;
  isValidatingToken: boolean;
  isTokenValid: boolean;
}

interface AuthActions {
  setAuth: (auth: {
    user: UserResource;
    token: string;
    orgId: string;
  }) => void;
  clearAuth: () => void;
  setIsLoading: (isLoading: boolean) => void;
  validateToken: () => Promise<boolean>;
  getToken: () => Promise<string | null>;
}

type AuthStore = AuthState & AuthActions;

const defaultInitState: AuthState = {
  isAuthenticated: false,
  user: null,
  orgId: null,
  isLoading: false,
  sessionId: createId({ prefix: 'session' }),
  isValidatingToken: false,
  isTokenValid: false,
};

// Create and export the store instance
const store = createStore<AuthStore>()((set, get) => ({
  ...defaultInitState,

  getToken: async () => {
    return secureStorage.getItem('token');
  },

  setAuth: async (auth: {
    user: UserResource;
    token: string;
    orgId: string;
  }) => {
    log(
      'Setting authentication state: orgId=%s, userId=%s',
      auth.orgId,
      auth.user.id,
    );

    const currentToken = await secureStorage.getItem('token');
    if (
      currentToken === auth.token &&
      get().user?.id === auth.user.id &&
      get().orgId === auth.orgId
    ) {
      log('Auth state unchanged, skipping update');
      return;
    }

    // Store token securely
    await secureStorage.setItem('token', auth.token);

    capture({
      event: 'user_authenticated',
      properties: {
        userId: auth.user.id,
        orgId: auth.orgId,
        email: auth.user.primaryEmailAddress?.emailAddress,
        isNewAuthentication: !get().isAuthenticated,
        sessionId: get().sessionId,
      },
    });

    log(
      'Updating auth state: isAuthenticated=true, userId=%s, orgId=%s, sessionId=%s',
      auth.user.id,
      auth.orgId,
      get().sessionId,
    );

    set({
      isAuthenticated: true,
      user: auth.user,
      orgId: auth.orgId,
    });

    // Validate token after setting it
    log('Initiating token validation after auth update');
    get()
      .validateToken()
      .catch((error) => {
        log('Token validation failed: %O', error);
      });
  },

  clearAuth: async () => {
    log('Clearing authentication state');
    const currentState = get();
    if (!currentState.isAuthenticated && !currentState.user) {
      log('Auth state already cleared, skipping');
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
          userId: currentState.user?.id,
          orgId: currentState.orgId,
          email: currentState.user?.primaryEmailAddress?.emailAddress,
          sessionId: currentState.sessionId,
        },
      });
    }

    // Remove token from secure storage
    await secureStorage.removeItem('token');

    log('Resetting auth state: sessionId=%s', currentState.sessionId);
    set({
      isAuthenticated: false,
      user: null,
      orgId: null,
      isTokenValid: false,
    });
  },

  setIsLoading: (isLoading: boolean) => {
    log('Setting loading state: isLoading=%s', isLoading);
    const currentState = get();
    if (currentState.isLoading === isLoading) {
      log('Loading state unchanged, skipping update');
      return;
    }
    set({ isLoading });
  },

  validateToken: async () => {
    const token = await secureStorage.getItem('token');
    log('Validating token: hasToken=%s', !!token);

    set({ isValidatingToken: true });

    if (!token) {
      log('No token found, setting isTokenValid=false');
      set({ isTokenValid: false, isValidatingToken: false });
      return false;
    }

    try {
      log('Verifying token with jsonwebtoken');

      // For client-side verification, we should have a mechanism to get the public key
      // Since we don't have direct access to the private key, we can verify basic properties
      // This is a simplified version that checks if the token can be decoded
      // and if basic structural properties are valid

      // Decode without verification to check the structure and expiration
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || typeof decoded !== 'object') {
        log('Token could not be decoded, logging out');
        set({ isTokenValid: false, isValidatingToken: false });
        get().clearAuth();
        return false;
      }

      // Check token expiration
      const expiryTime = (decoded.payload as jwt.JwtPayload).exp;
      if (!expiryTime || Date.now() >= expiryTime * 1000) {
        log('Token is expired, logging out');
        set({ isTokenValid: false, isValidatingToken: false });
        get().clearAuth();
        return false;
      }

      log(
        'Token has valid structure and is not expired, setting isTokenValid=true',
      );
      set({
        isTokenValid: true,
        isValidatingToken: false,
        isAuthenticated: true,
      });
      return true;
    } catch (error) {
      log('Error validating token: %O', error);
      set({ isTokenValid: false, isValidatingToken: false });
      get().clearAuth();
      return false;
    }
  },
}));

export const useAuthStore = createSelectors(store);
