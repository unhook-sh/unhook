import type { UserResource } from '@clerk/types';
import { createId } from '@unhook/id';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';
import { ClerkService } from '../lib/auth/clerk-service';
import { capture } from '../lib/posthog';

const log = debug('unhook:cli:auth-store');

export interface AuthState {
  isSignedIn: boolean;
  user: UserResource | null;
  orgId: string | null;
  token: string | null;
  sessionId: string;
  isValidatingSession: boolean;
  authUrl: string | null;
  isSigningIn: boolean;
}

interface AuthActions {
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  setSigningIn: (isSigningIn: boolean) => void;
  setAuthUrl: (authUrl: string | null) => void;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;

const defaultInitState: AuthState = {
  isSignedIn: false,
  user: null,
  orgId: null,
  token: null,
  sessionId: createId({ prefix: 'session' }),
  isValidatingSession: false,
  authUrl: null,
  isSigningIn: false,
};

// Create and export the store instance
const store = createStore<AuthStore>()((set, get) => ({
  ...defaultInitState,

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
          userId: currentState.user?.id,
          orgId: currentState.orgId,
          email: currentState.user?.primaryEmailAddress?.emailAddress,
          sessionId: currentState.sessionId,
        },
      });
    }

    log('Resetting auth state: sessionId=%s', currentState.sessionId);

    try {
      const clerkService = ClerkService.getInstance();
      await clerkService.signOut();
    } catch (error) {
      log('Error signing out: %O', error);
    } finally {
      get().reset();
    }
  },

  validateSession: async () => {
    set({ isValidatingSession: true });

    const clerkService = ClerkService.getInstance();
    log('Validating token');

    try {
      const { user, orgId, sessionToken } = await clerkService.getSessionData();

      capture({
        event: 'session_validated',
        properties: {
          userId: user.id,
          orgId,
          email: user.primaryEmailAddress?.emailAddress,
          sessionId: get().sessionId,
        },
      });

      set({
        isValidatingSession: false,
        isSignedIn: true,
        user,
        orgId,
        token: sessionToken,
      });
      return true;
    } catch (error) {
      log('Error validating token: %O', error);
      await get().logout();
      return false;
    }
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

  setAuthUrl: (authUrl: string | null) => {
    log('Setting auth URL:', authUrl);
    set({ authUrl });
    capture({
      event: 'auth_state_updated',
      properties: {
        hasAuthUrl: !!authUrl,
      },
    });
  },

  reset: () => {
    log('Resetting auth state');
    set({
      ...defaultInitState,
      sessionId: createId({ prefix: 'session' }), // Generate new session ID on reset
    });
    capture({
      event: 'auth_state_reset',
    });
  },
}));

export const useAuthStore = createSelectors(store);
