import {
  type IncomingMessage,
  type Server,
  type ServerResponse,
  createServer,
} from 'node:http';
import { debug } from '@unhook/logger';
import { capture } from '../posthog';
import { InvalidAuthResponseError } from './errors';
import type { AuthResult } from './service';

const log = debug('unhook:cli:auth-server');

interface AuthCallbackParams {
  state: string | null;
  ticket: string | null;
  userId: string | null;
  orgId: string | null;
  error: string | null;
}

export class AuthServer {
  private server: Server | null = null;
  private resolveAuth: ((value: AuthResult) => void) | null = null;
  private rejectAuth: ((reason: Error) => void) | null = null;

  private parseCallbackParams(url: URL): AuthCallbackParams {
    return {
      state: url.searchParams.get('state'),
      ticket: url.searchParams.get('ticket'),
      userId: url.searchParams.get('userId'),
      orgId: url.searchParams.get('orgId'),
      error: url.searchParams.get('error'),
    };
  }

  private setCorsHeaders(res: ServerResponse): void {
    const webAppUrl = process.env.WEB_APP_URL || 'http://localhost:3000';
    res.setHeader('Access-Control-Allow-Origin', webAppUrl);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  private handlePreflightRequest(res: ServerResponse): void {
    log('Handling OPTIONS preflight request');
    res.writeHead(204);
    res.end();
  }

  private handleInvalidRequest(res: ServerResponse, error: Error): void {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid request');
    this.rejectAuth?.(error);
  }

  private async handleCallback(
    req: IncomingMessage,
    res: ServerResponse,
    stateToken: string,
    port: number,
  ): Promise<void> {
    log('Received request:', req.method, req.url);
    capture({
      event: 'auth_request_received',
      properties: {
        method: req.method,
        url: req.url,
      },
    });

    if (!req.url) {
      this.handleInvalidRequest(
        res,
        new InvalidAuthResponseError({ reason: 'missing_url' }),
      );
      return;
    }

    const url = new URL(req.url, `http://localhost:${port}`);
    const params = this.parseCallbackParams(url);

    log('Parsed URL parameters:', {
      state: params.state,
      hasTicket: !!params.ticket,
      hasUserId: !!params.userId,
      hasOrgId: !!params.orgId,
      error: params.error,
    });

    this.setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      this.handlePreflightRequest(res);
      return;
    }

    if (params.error) {
      this.handleInvalidRequest(
        res,
        new InvalidAuthResponseError({ error: params.error }),
      );
      return;
    }

    if (
      !params.state ||
      !params.ticket ||
      !params.userId ||
      params.state !== stateToken
    ) {
      this.handleInvalidRequest(
        res,
        new InvalidAuthResponseError({
          hasState: !!params.state,
          hasTicket: !!params.ticket,
          hasUserId: !!params.userId,
          stateMatches: params.state === stateToken,
        }),
      );
      return;
    }

    // Redirect to success page
    const successUrl = `${process.env.NEXT_PUBLIC_API_URL}/cli-token/success`;
    res.writeHead(302, { Location: successUrl });
    res.end();

    capture({
      event: 'auth_callback_success',
      properties: {
        userId: params.userId,
        orgId: params.orgId,
      },
    });

    if (!params.userId || !params.ticket || !params.orgId) {
      this.handleInvalidRequest(
        res,
        new InvalidAuthResponseError({
          reason: 'missing_required_params',
          hasUserId: !!params.userId,
          hasTicket: !!params.ticket,
          hasOrgId: !!params.orgId,
        }),
      );
      return;
    }

    log('Authentication successful:', {
      userId: params.userId,
      orgId: params.orgId,
    });

    this.resolveAuth?.({
      ticket: params.ticket,
      userId: params.userId,
      orgId: params.orgId,
    });
  }

  public start({
    stateToken,
    port,
  }: {
    stateToken: string;
    port: number;
  }): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      this.resolveAuth = resolve;
      this.rejectAuth = reject;

      if (!this.server) {
        this.server = createServer(async (req, res) => {
          await this.handleCallback(req, res, stateToken, port);
        });

        this.server.on('error', (err) => {
          log('Server error:', err.message);
          const error = new InvalidAuthResponseError({
            reason: 'server_error',
            error: err.message,
          });
          this.rejectAuth?.(error);
          this.stop();
        });

        this.server.listen(port, () => {
          log('Auth server listening on port', port);
          capture({
            event: 'auth_server_started',
            properties: {
              port,
            },
          });
        });
      }
    });
  }

  public stop(): void {
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
}
