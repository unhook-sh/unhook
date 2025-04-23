import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import type { UserResource } from '@clerk/types';
import { debug } from '@unhook/logger';
import open from 'open';
import { env } from '../../env';
import { useAuthStore } from '../../stores/auth-store';
import { capture, captureException } from '../posthog';
import { createClerkClient } from './clerk';

const log = debug('unhook:cli:auth-service');

interface AuthConfig {
  webAppUrl: string;
  clientPort: number;
}

export type AuthResult = {
  token: string;
  userId: string;
  orgId: string;
};

export type DecoratedAuthResult = { user: UserResource } & AuthResult;

export class AuthService {
  private server: ReturnType<typeof createServer> | null = null;
  private stateToken: string | null = null;
  private resolveAuth: ((value: AuthResult) => void) | null = null;
  private rejectAuth: ((reason: Error) => void) | null = null;
  public authUrl: string | null = null;
  private isAuthenticating = false;

  constructor(private config: AuthConfig) {}

  private generateStateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private startServer(): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      this.resolveAuth = resolve;
      this.rejectAuth = reject;

      // Create server only if it doesn't exist already
      if (!this.server) {
        this.server = createServer(async (req, res) => {
          log('Received request:', req.method, req.url);
          capture({
            event: 'auth_request_received',
            properties: {
              method: req.method,
              url: req.url,
            },
          });

          if (!req.url) {
            const error = new Error('Invalid request URL');
            log('Invalid request: missing URL');
            captureException(error);
            capture({
              event: 'auth_request_invalid',
              properties: {
                reason: 'missing_url',
              },
            });
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid request');
            this.rejectAuth?.(error);
            return;
          }

          const url = new URL(
            req.url,
            `http://localhost:${this.config.clientPort}`,
          );
          log('Parsed URL parameters:', {
            state: url.searchParams.get('state'),
            hasToken: !!url.searchParams.get('token'),
            hasUserId: !!url.searchParams.get('userId'),
            hasOrgId: !!url.searchParams.get('orgId'),
            error: url.searchParams.get('error'),
          });

          const state = url.searchParams.get('state');
          const token = url.searchParams.get('token');
          const userId = url.searchParams.get('userId');
          const orgId = url.searchParams.get('orgId');
          const error = url.searchParams.get('error');

          // Set CORS headers
          res.setHeader('Access-Control-Allow-Origin', this.config.webAppUrl);
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          // Handle preflight request
          if (req.method === 'OPTIONS') {
            log('Handling OPTIONS preflight request');
            res.writeHead(204);
            res.end();
            return;
          }

          if (error) {
            const authError = new Error(`Authentication error: ${error}`);
            log('Authentication error:', error);
            captureException(authError);
            capture({
              event: 'auth_callback_error',
              properties: {
                error,
              },
            });
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Authentication failed');
            this.rejectAuth?.(authError);
            return;
          }

          if (!state || !token || !userId || state !== this.stateToken) {
            const invalidError = new Error('Invalid authentication response');
            log('Invalid authentication response:', {
              hasState: !!state,
              hasToken: !!token,
              hasUserId: !!userId,
              stateMatches: state === this.stateToken,
            });
            captureException(invalidError);
            capture({
              event: 'auth_callback_invalid',
              properties: {
                hasState: !!state,
                hasToken: !!token,
                hasUserId: !!userId,
                stateMatches: state === this.stateToken,
              },
            });
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid request');
            this.rejectAuth?.(invalidError);
            return;
          }

          // Redirect to success page instead of rendering template
          const successUrl = `${env.NEXT_PUBLIC_API_URL}/cli-token/success`;
          res.writeHead(302, { Location: successUrl });
          res.end();

          capture({
            event: 'auth_callback_success',
            properties: {
              userId,
              orgId,
            },
          });

          if (!userId) {
            this.rejectAuth?.(new Error('User ID is required'));
            return;
          }

          if (!token) {
            const tokenError = new Error(
              'Token was not returned from the cli login url',
            );
            log('Token error:', tokenError);
            captureException(tokenError);
            capture({
              event: 'auth_token_failed',
            });
            throw tokenError;
          }

          if (!orgId) {
            this.rejectAuth?.(new Error('Organization ID is required'));
            return;
          }

          log('Authentication successful:', { userId, orgId });
          this.resolveAuth?.({
            token,
            userId,
            orgId,
          });
        });

        this.server.on('error', (err) => {
          log('Server error:', err.message);
          captureException(err);
          capture({
            event: 'auth_server_error',
            properties: {
              error: err.message,
            },
          });
          this.rejectAuth?.(new Error(`Server error: ${err.message}`));
          this.isAuthenticating = false;
          this.stopServer();
        });

        this.server.listen(this.config.clientPort, () => {
          log('Auth server listening on port', this.config.clientPort);
          capture({
            event: 'auth_server_started',
            properties: {
              port: this.config.clientPort,
            },
          });
        });
      }
    });
  }

  private stopServer() {
    if (this.server) {
      log('Stopping auth server');
      capture({
        event: 'auth_server_stopped',
      });
      this.server.close();
      this.server = null;
    }
    this.resolveAuth = null;
    this.rejectAuth = null;
  }

  async authenticate(): Promise<DecoratedAuthResult> {
    // Prevent multiple authentication attempts
    if (this.isAuthenticating) {
      log('Authentication already in progress');
      capture({
        event: 'auth_attempt_duplicate',
      });
      throw new Error('Authentication already in progress');
    }

    try {
      this.isAuthenticating = true;
      this.stateToken = this.generateStateToken();
      const authUrl = new URL('/cli-token', this.config.webAppUrl);
      authUrl.searchParams.set(
        'redirectUrl',
        `http://localhost:${this.config.clientPort}/callback`,
      );
      authUrl.searchParams.set('state', this.stateToken);

      // Store the auth URL
      this.authUrl = authUrl.toString();
      log('Starting authentication flow with URL:', this.authUrl);
      capture({
        event: 'auth_flow_started',
        properties: {
          clientPort: this.config.clientPort,
        },
      });

      // Start local server to handle callback
      const authPromise = this.startServer();

      // Open browser for authentication
      log('Opening browser for authentication');
      await open(this.authUrl);
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

      const clerk = await createClerkClient();

      if (!clerk.isSignedIn) {
        log('Signing in with Clerk using ticket');
        capture({
          event: 'auth_clerk_signin_started',
        });
        const signInResponse = await clerk.client?.signIn.create({
          strategy: 'ticket',
          ticket: result.token,
        });

        if (signInResponse?.status !== 'complete') {
          const signInError = new Error('Failed to sign in with Clerk');
          log('Sign in error:', signInError);
          captureException(signInError);
          capture({
            event: 'auth_clerk_signin_failed',
          });
          throw signInError;
        }

        log('Signed in with Clerk using ticket');
        capture({
          event: 'auth_clerk_signin_completed',
        });
      }

      log('Fetching session token');
      const sessionToken = await clerk.client?.signedInSessions[0]?.getToken({
        template: 'supabase',
      });

      log('Clerk user:', clerk.session?.user, sessionToken);
      if (!sessionToken) {
        const tokenError = new Error('Token was not returned from Clerk');
        log('Token error:', tokenError);
        captureException(tokenError);
        capture({
          event: 'auth_token_failed',
        });
        throw tokenError;
      }

      const user = clerk.client?.signedInSessions[0]?.user;

      if (!user) {
        const userError = new Error('Failed to get user');
        log('User error:', userError);
        captureException(userError);
        capture({
          event: 'auth_user_fetch_failed',
        });
        throw userError;
      }

      log('Authentication completed successfully');
      capture({
        event: 'auth_completed',
      });

      return {
        user,
        token: sessionToken,
        userId: result.userId,
        orgId: result.orgId,
      };
    } catch (error) {
      log('Authentication error:', error);
      captureException(
        error instanceof Error
          ? error
          : new Error('Unknown authentication error'),
      );
      capture({
        event: 'auth_failed',
        properties: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    } finally {
      this.stopServer();
      this.authUrl = null;
      this.isAuthenticating = false;
    }
  }

  getAuthUrl(): string | null {
    return this.authUrl;
  }

  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }

  isInProgress(): boolean {
    return this.isAuthenticating;
  }

  logout(): void {
    this.stopServer();
    this.authUrl = null;
    this.stateToken = null;
    this.isAuthenticating = false;

    // Clear auth store state
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
  }
}
