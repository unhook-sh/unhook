import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import type { SignInResource } from '@clerk/types';
import open from 'open';
import { createClerkClient } from './clerk';
import { useAuthStore } from './store';
import { getAuthSuccessTemplate } from './templates/get-template';

interface AuthConfig {
  webAppUrl: string;
  clientPort: number;
}

export class AuthService {
  private server: ReturnType<typeof createServer> | null = null;
  private stateToken: string | null = null;
  private resolveAuth:
    | ((value: {
        token: string;
        userId: string;
        orgId?: string | null;
      }) => void)
    | null = null;
  private rejectAuth: ((reason: Error) => void) | null = null;
  public authUrl: string | null = null;

  constructor(private config: AuthConfig) {}

  private generateStateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private startServer(): Promise<{
    token: string;
    userId: string;
    orgId?: string | null;
  }> {
    return new Promise((resolve, reject) => {
      this.resolveAuth = resolve;
      this.rejectAuth = reject;

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

        try {
          const html = await getAuthSuccessTemplate();
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
        } catch (error) {
          console.error('Failed to read success template:', error);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Authentication successful! You can close this window.');
        }

        this.resolveAuth?.({
          token,
          userId,
          orgId,
        });
      });

      this.server.listen(this.config.clientPort);
    });
  }

  private stopServer() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  async authenticate(): Promise<{
    token: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    orgId?: string | null;
  }> {
    try {
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
      let signInResponse: SignInResource | undefined;

      if (!clerk.isSignedIn) {
        signInResponse = await clerk.client?.signIn.create({
          strategy: 'ticket',
          ticket: result.token,
        });
      }

      const token = await clerk.session?.getToken();

      if (!token) {
        throw new Error('Failed to get token');
      }

      return {
        token,
        userId: result.userId,
        firstName: signInResponse?.userData.firstName,
        lastName: signInResponse?.userData.lastName,
        orgId: result.orgId,
      };
    } finally {
      this.stopServer();
      this.authUrl = null;
    }
  }

  getAuthUrl(): string | null {
    return this.authUrl;
  }

  logout(): void {
    this.stopServer();
    this.authUrl = null;
    this.stateToken = null;

    // Clear auth store state
    useAuthStore.setState({
      isAuthenticated: false,
      token: null,
      userId: null,
      isLoading: false,
    });
  }
}
