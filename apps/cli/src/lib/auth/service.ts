import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import type { UserResource } from '@clerk/types';
import open from 'open';
import { env } from '../../env';
import { useAuthStore } from '../../stores/auth-store';
import { createClerkClient } from './clerk';

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
          if (!req.url) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid request');
            this.rejectAuth?.(new Error('Invalid request URL'));
            return;
          }

          const url = new URL(
            req.url,
            `http://localhost:${this.config.clientPort}`,
          );
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
            res.writeHead(204);
            res.end();
            return;
          }

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Authentication failed');
            this.rejectAuth?.(new Error(error));
            return;
          }

          if (!state || !token || !userId || state !== this.stateToken) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid request');
            this.rejectAuth?.(new Error('Invalid authentication response'));
            return;
          }

          // Redirect to success page instead of rendering template
          const successUrl = `${env.NEXT_PUBLIC_API_URL}/cli-token/success`;
          res.writeHead(302, { Location: successUrl });
          res.end();

          if (!userId) {
            this.rejectAuth?.(new Error('User ID is required'));
            return;
          }

          if (!token) {
            this.rejectAuth?.(new Error('Token is required'));
            return;
          }

          if (!orgId) {
            this.rejectAuth?.(new Error('Organization ID is required'));
            return;
          }

          this.resolveAuth?.({
            token,
            userId,
            orgId,
          });
        });

        this.server.on('error', (err) => {
          this.rejectAuth?.(new Error(`Server error: ${err.message}`));
          this.isAuthenticating = false;
          this.stopServer();
        });

        this.server.listen(this.config.clientPort, () => {
          // Server started successfully
        });
      }
    });
  }

  private stopServer() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this.resolveAuth = null;
    this.rejectAuth = null;
  }

  async authenticate(): Promise<DecoratedAuthResult> {
    // Prevent multiple authentication attempts
    if (this.isAuthenticating) {
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

      // Start local server to handle callback
      const authPromise = this.startServer();

      // Open browser for authentication
      await open(this.authUrl);

      // Wait for authentication response
      const result = await authPromise;

      const clerk = await createClerkClient();

      if (!clerk.isSignedIn) {
        await clerk.client?.signIn.create({
          strategy: 'ticket',
          ticket: result.token,
        });
      }

      const token = await clerk.session?.getToken({ template: 'supabase' });

      if (!token) {
        throw new Error('Failed to get token');
      }

      const user = clerk.user;

      if (!user) {
        throw new Error('Failed to get user');
      }

      return {
        user,
        token,
        userId: result.userId,
        orgId: result.orgId,
      };
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
