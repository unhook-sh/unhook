import * as http from 'node:http';
import * as vscode from 'vscode';
import { env } from '../env';
import type { AuthStore } from '../services/auth.service';

interface AuthenticationProvider {
  onDidChangeSessions: vscode.Event<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>;
  getSessions(scopes: string[]): Promise<vscode.AuthenticationSession[]>;
  createSession(scopes: string[]): Promise<vscode.AuthenticationSession>;
  removeSession(sessionId: string): Promise<void>;
}

export class UnhookAuthProvider implements AuthenticationProvider {
  private static readonly AUTH_TYPE = 'unhook';
  private static readonly SCOPES = ['openid', 'email', 'profile'];

  private _onDidChangeSessions =
    new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
  readonly onDidChangeSessions = this._onDidChangeSessions.event;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly authStore: AuthStore,
  ) {
    // Listen for auth store changes and emit session changes
    this.authStore.onDidChangeAuth(() => {
      this._onDidChangeSessions.fire({ added: [], removed: [], changed: [] });
    });
  }

  private getEditorUriScheme(): string {
    // Get the current editor's URI scheme
    const appName = vscode.env.appName.toLowerCase();
    if (appName.includes('cursor')) {
      return 'cursor';
    }
    if (appName.includes('insiders')) {
      return 'vscode-insiders';
    }
    if (appName.includes('windsurf')) {
      return 'windsurf';
    }
    return 'vscode';
  }

  static register(context: vscode.ExtensionContext, authStore: AuthStore) {
    const provider = new UnhookAuthProvider(context, authStore);
    return vscode.authentication.registerAuthenticationProvider(
      UnhookAuthProvider.AUTH_TYPE,
      'Unhook',
      provider,
      {
        supportsMultipleAccounts: false,
      },
    );
  }

  async getSessions(scopes: string[]): Promise<vscode.AuthenticationSession[]> {
    const session = await this.getSession(scopes);
    return session ? [session] : [];
  }

  async getSession(
    _scopes: string[],
  ): Promise<vscode.AuthenticationSession | undefined> {
    if (!this.authStore.isSignedIn) {
      return undefined;
    }

    return {
      id: this.authStore.sessionId ?? '',
      accessToken: this.authStore.authToken ?? '',
      account: {
        id: this.authStore.user?.id ?? '',
        label: this.authStore.user?.email ?? '',
      },
      scopes: UnhookAuthProvider.SCOPES,
    };
  }

  async createSession(scopes: string[]): Promise<vscode.AuthenticationSession> {
    try {
      // Open browser for auth
      const authUrl = new URL('/cli-token', env.NEXT_PUBLIC_API_URL);
      const editorScheme = this.getEditorUriScheme();
      authUrl.searchParams.set(
        'redirect_uri',
        `${editorScheme}://${env.NEXT_PUBLIC_VSCODE_EXTENSION_ID}`,
      );
      await vscode.env.openExternal(vscode.Uri.parse(authUrl.toString()));

      // Wait for the auth code from VS Code
      const session = await vscode.authentication.getSession(
        UnhookAuthProvider.AUTH_TYPE,
        scopes,
        { createIfNone: true },
      );

      if (!session) {
        throw new Error('No session returned from VS Code auth');
      }

      // Use your existing code exchange
      const { authToken, sessionId, user } =
        await this.authStore.api.auth.exchangeAuthCode.mutate({
          code: session.accessToken, // VS Code will pass the code as the accessToken
        });

      // Update auth store
      await this.authStore.setAuthToken({ token: authToken });
      await this.authStore.setSessionId({ sessionId });
      this.authStore.setUser(user);

      const newSession: vscode.AuthenticationSession = {
        id: sessionId,
        accessToken: authToken,
        account: {
          id: user.id,
          label: user.email ?? '',
        },
        scopes: UnhookAuthProvider.SCOPES,
      };

      this._onDidChangeSessions.fire({
        added: [newSession],
        removed: [],
        changed: [],
      });

      return newSession;
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create authentication session: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async removeSession(_sessionId: string): Promise<void> {
    const session = await this.getSession(UnhookAuthProvider.SCOPES);
    await this.authStore.signOut();
    if (session) {
      this._onDidChangeSessions.fire({
        added: [],
        removed: [session],
        changed: [],
      });
    }
  }

  private async startAuthServer(port: number, csrfToken: string) {
    const server = new AuthServer();
    await server.start({ port, csrfToken });
    return server;
  }
}

class AuthServer {
  private server: http.Server | undefined;
  private resolveAuth: ((result: { code: string }) => void) | undefined;
  private rejectAuth: ((error: Error) => void) | undefined;

  async start({ port, csrfToken }: { port: number; csrfToken: string }) {
    return new Promise<void>((resolve, _reject) => {
      this.server = http.createServer(
        (req: http.IncomingMessage, res: http.ServerResponse) => {
          if (req.url?.startsWith('/auth/callback')) {
            const params = new URLSearchParams(req.url.split('?')[1]);
            const code = params.get('code');
            const receivedCsrf = params.get('csrf');

            if (code && receivedCsrf === csrfToken) {
              this.resolveAuth?.({ code });
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(
                '<h1>Authentication successful! You can close this window.</h1>',
              );
            } else {
              this.rejectAuth?.(new Error('Invalid auth response'));
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end('<h1>Authentication failed. Please try again.</h1>');
            }
          } else {
            res.writeHead(404);
            res.end();
          }
        },
      );

      this.server.listen(port, () => {
        resolve();
      });
    });
  }

  waitForAuth() {
    return new Promise<{ code: string }>((resolve, reject) => {
      this.resolveAuth = resolve;
      this.rejectAuth = reject;
    });
  }

  stop() {
    this.server?.close();
  }
}
