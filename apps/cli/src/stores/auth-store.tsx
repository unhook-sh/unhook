import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { UserResource } from '@clerk/types';
import { createId } from '@unhook/id';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import jwt from 'jsonwebtoken';
import { createStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { capture } from '../lib/posthog';

const log = debug('unhook:cli:auth-store');
const AUTH_STORAGE_BASE_PATH = path.join(os.homedir(), '.unhook');

// Fetch the JWKS URL for Clerk
const CLERK_JWKS_URL = 'https://api.clerk.dev/v1/jwks';

interface AuthState {
  isAuthenticated: boolean;
  user: UserResource | null;
  token: string | null;
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
}

type AuthStore = AuthState & AuthActions;

const defaultInitState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  orgId: null,
  isLoading: false,
  sessionId: createId({ prefix: 'session' }),
  isValidatingToken: false,
  isTokenValid: false,
};

// Create a custom storage that uses the file system
const fsStorage = {
  getItem: (name: string): string | null => {
    const filePath = path.join(AUTH_STORAGE_BASE_PATH, `${name}.json`);
    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      log('Reading auth state from %s', filePath);
      return fs.existsSync(filePath)
        ? fs.readFileSync(filePath, 'utf-8')
        : null;
    } catch (error) {
      log('Error reading from storage: %O', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    const filePath = path.join(AUTH_STORAGE_BASE_PATH, `${name}.json`);
    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      log('Writing auth state to %s', filePath);
      fs.writeFileSync(filePath, value, 'utf-8');
    } catch (error) {
      log('Error writing to storage: %O', error);
    }
  },
  removeItem: (name: string): void => {
    const filePath = path.join(AUTH_STORAGE_BASE_PATH, `${name}.json`);
    try {
      if (fs.existsSync(filePath)) {
        log('Removing auth state from %s', filePath);
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      log('Error removing from storage: %O', error);
    }
  },
};

// Create and export the store instance
const store = createStore<AuthStore>()(
  persist(
    (set, get) => ({
      ...defaultInitState,
      setAuth: (auth: {
        user: UserResource;
        token: string;
        orgId: string;
      }) => {
        log(
          'Setting authentication state: orgId=%s, userId=%s',
          auth.orgId,
          auth.user.id,
        );
        const currentState = get();
        if (
          currentState.token === auth.token &&
          currentState.user?.id === auth.user.id &&
          currentState.orgId === auth.orgId
        ) {
          log('Auth state unchanged, skipping update');
          return;
        }

        capture({
          event: 'user_authenticated',
          properties: {
            userId: auth.user.id,
            orgId: auth.orgId,
            email: auth.user.primaryEmailAddress?.emailAddress,
            isNewAuthentication: !currentState.isAuthenticated,
            sessionId: currentState.sessionId,
          },
        });

        log(
          'Updating auth state: isAuthenticated=true, userId=%s, orgId=%s, sessionId=%s',
          auth.user.id,
          auth.orgId,
          currentState.sessionId,
        );
        set({
          isAuthenticated: true,
          user: auth.user,
          token: auth.token,
          orgId: auth.orgId,
          sessionId: currentState.sessionId,
        });

        // Validate token after setting it
        log('Initiating token validation after auth update');
        get()
          .validateToken()
          .catch((error) => {
            log('Token validation failed: %O', error);
          });
      },
      clearAuth: () => {
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

        log('Resetting auth state: sessionId=%s', currentState.sessionId);
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          orgId: null,
          isTokenValid: false,
          sessionId: currentState.sessionId,
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
        const { token, clearAuth } = get();
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
            clearAuth();
            return false;
          }

          // Check token expiration
          const expiryTime = (decoded.payload as jwt.JwtPayload).exp;
          if (!expiryTime || Date.now() >= expiryTime * 1000) {
            log('Token is expired, logging out');
            set({ isTokenValid: false, isValidatingToken: false });
            clearAuth();
            return false;
          }

          log(
            'Token has valid structure and is not expired, setting isTokenValid=true',
          );
          set({ isTokenValid: true, isValidatingToken: false });
          return true;
        } catch (error) {
          log('Error validating token: %O', error);
          set({ isTokenValid: false, isValidatingToken: false });
          clearAuth();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => fsStorage),
    },
  ),
);

export const useAuthStore = createSelectors(store);
