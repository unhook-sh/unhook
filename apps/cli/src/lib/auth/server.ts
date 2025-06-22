import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import { debug } from '@unhook/logger';
import { env } from '~/env';
import { capture } from '../posthog';
import { InvalidAuthResponseError } from './errors';

const log = debug('unhook:cli:auth-server');

interface AuthCallbackParams {
  csrfToken: string | null;
  code: string | null;
  error: string | null;
}

export class AuthServer {
  private server: Server | null = null;
  private resolveAuth: ((value: { code: string }) => void) | null = null;
  private rejectAuth: ((reason: Error) => void) | null = null;

  private parseCallbackParams(url: URL): AuthCallbackParams {
    return {
      csrfToken: url.searchParams.get('csrf'),
      code: url.searchParams.get('code'),
      error: url.searchParams.get('error'),
    };
  }

  private setCorsHeaders(res: ServerResponse): void {
    const webAppUrl = env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
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
    csrfToken: string,
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
      csrfToken: params.csrfToken,
      hasCode: !!params.code,
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

    if (!params.csrfToken || !params.code || params.csrfToken !== csrfToken) {
      this.handleInvalidRequest(
        res,
        new InvalidAuthResponseError({
          hasCsrfToken: !!params.csrfToken,
          hasCode: !!params.code,
          csrfTokenMatches: params.csrfToken === csrfToken,
        }),
      );
      return;
    }

    // Redirect to success page
    const successUrl = `${env.NEXT_PUBLIC_API_URL}/cli-token/success`;
    res.writeHead(302, { Location: successUrl });
    res.end();

    capture({
      event: 'auth_callback_success',
      properties: {
        code: params.code,
      },
    });

    if (!params.code) {
      this.handleInvalidRequest(
        res,
        new InvalidAuthResponseError({
          reason: 'missing_required_params',
          hasCode: !!params.code,
        }),
      );
      return;
    }

    log('Authentication successful:', {
      code: params.code,
    });

    this.resolveAuth?.({
      code: params.code,
    });
  }

  public start({
    csrfToken,
    port,
  }: {
    csrfToken: string;
    port: number;
  }): Promise<{ code: string }> {
    return new Promise((resolve, reject) => {
      this.resolveAuth = resolve;
      this.rejectAuth = reject;

      if (!this.server) {
        this.server = createServer(async (req, res) => {
          await this.handleCallback(req, res, csrfToken, port);
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
