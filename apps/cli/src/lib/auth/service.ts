import type { UserResource } from '@clerk/types';
import { createId } from '@unhook/id';
import { debug } from '@unhook/logger';
import open from 'open';
import { findAvailablePort } from '~/utils/port';
import { useAuthStore } from '../../stores/auth-store';
import { capture } from '../posthog';
import { ClerkService } from './clerk-service';
import { AuthenticationInProgressError, handleAuthError } from './errors';
import { AuthServer } from './server';

const log = debug('unhook:cli:auth-service');

export type AuthResult = {
  ticket: string;
  userId: string;
  orgId: string;
};

export type DecoratedAuthResult = { user: UserResource } & AuthResult;

export class AuthService {
  private authServer: AuthServer;
  private clerkService: ClerkService;
  private stateToken: string | null = null;

  constructor() {
    this.authServer = new AuthServer();
    this.clerkService = ClerkService.getInstance();
  }

  async authenticate(): Promise<void> {
    this.reset();
    const store = useAuthStore.getState();

    if (store.isSigningIn) {
      throw new AuthenticationInProgressError();
    }

    try {
      store.setSigningIn(true);
      this.stateToken = createId({ prefix: 'auth_state' });
      const port = await findAvailablePort();
      const webAppUrl = process.env.WEB_APP_URL || 'http://localhost:3000';
      const authUrl = new URL('/cli-token', webAppUrl);
      authUrl.searchParams.set(
        'redirectUrl',
        `http://localhost:${port}/callback`,
      );
      authUrl.searchParams.set('state', this.stateToken);

      // Store the auth URL
      store.setAuthUrl(authUrl.toString());
      log('Starting authentication flow with URL:', authUrl.toString());
      capture({
        event: 'auth_flow_started',
        properties: {
          clientPort: port,
        },
      });

      // Start local server to handle callback
      const authPromise = this.authServer.start({
        stateToken: this.stateToken,
        port,
      });

      // Open browser for authentication
      log('Opening browser for authentication');
      await open(authUrl.toString());
      capture({
        event: 'auth_browser_opened',
      });

      // Wait for authentication response
      const result = await authPromise;
      log('Received authentication result');
      capture({
        event: 'auth_callback_received',
        properties: {
          hasUserId: !!result.userId,
          hasOrgId: !!result.orgId,
        },
      });

      // Handle Clerk authentication
      await this.clerkService.signInWithTicket(result.ticket);
      const { user, orgId } = await this.clerkService.getSessionData();
      await store.validateSession();

      log('Authentication completed successfully');
      capture({
        event: 'user_authenticated',
        distinctId: user.id,
        properties: {
          userId: user.id,
          orgId,
          email: user.primaryEmailAddress?.emailAddress,
        },
      });
    } catch (error) {
      handleAuthError(error);
    } finally {
      this.authServer.stop();
      this.stateToken = null;
    }
  }

  reset() {
    this.authServer.stop();
    this.stateToken = null;
  }
}
