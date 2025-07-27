import * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';
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

  private _pendingAuth:
    | {
        resolve: (session: vscode.AuthenticationSession) => void;
        reject: (error: Error) => void;
      }
    | undefined;

  constructor(
    _context: vscode.ExtensionContext,
    private readonly authStore: AuthStore,
  ) {
    // Listen for auth store changes and emit session changes
    this.authStore.onDidChangeAuth(() => {
      this._onDidChangeSessions.fire({ added: [], changed: [], removed: [] });
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
    const disposable = vscode.authentication.registerAuthenticationProvider(
      UnhookAuthProvider.AUTH_TYPE,
      'Unhook',
      provider,
      {
        supportsMultipleAccounts: false,
      },
    );
    return { disposable, provider };
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
      accessToken: this.authStore.authToken ?? '',
      account: {
        id: this.authStore.user?.id ?? '',
        label: this.authStore.user?.email ?? '',
      },
      id: this.authStore.sessionId ?? '',
      scopes: UnhookAuthProvider.SCOPES,
    };
  }

  async createSession(
    _scopes: string[],
  ): Promise<vscode.AuthenticationSession> {
    try {
      // Open browser for auth
      const authUrl = new URL(
        '/app/auth-code',
        ConfigManager.getInstance().getApiUrl(),
      );
      const editorScheme = this.getEditorUriScheme();
      authUrl.searchParams.set(
        'redirect_uri',
        `${editorScheme}://${env.NEXT_PUBLIC_VSCODE_EXTENSION_ID}`,
      );

      // Create a promise that will be resolved by the URI handler
      const authPromise = new Promise<vscode.AuthenticationSession>(
        (resolve, reject) => {
          this._pendingAuth = { reject, resolve };

          // Set a timeout in case the auth flow fails
          setTimeout(() => {
            if (this._pendingAuth) {
              this._pendingAuth = undefined;
              reject(new Error('Authentication timed out'));
            }
          }, 120000); // 2 minute timeout
        },
      );

      // Open the browser
      await vscode.env.openExternal(vscode.Uri.parse(authUrl.toString()));

      // Wait for the auth to complete
      const session = await authPromise;

      this._onDidChangeSessions.fire({
        added: [session],
        changed: [],
        removed: [],
      });

      return session;
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create authentication session: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // Method to be called by the URI handler when auth is complete
  async completeAuth(code: string): Promise<void> {
    if (!this._pendingAuth) {
      // No pending auth flow
      return;
    }

    try {
      // Exchange the auth code
      const { authToken, sessionId, user } =
        await this.authStore.exchangeAuthCode({ code });

      const session: vscode.AuthenticationSession = {
        accessToken: authToken,
        account: {
          id: user.id,
          label: user.email ?? '',
        },
        id: sessionId,
        scopes: UnhookAuthProvider.SCOPES,
      };

      // Resolve the pending auth promise
      this._pendingAuth.resolve(session);
      this._pendingAuth = undefined;

      // Show success message
      vscode.window.showInformationMessage('Successfully signed in to Unhook');
    } catch (error) {
      this._pendingAuth?.reject(error as Error);
      this._pendingAuth = undefined;
    }
  }

  async removeSession(_sessionId: string): Promise<void> {
    const session = await this.getSession(UnhookAuthProvider.SCOPES);
    await this.authStore.signOut();
    if (session) {
      this._onDidChangeSessions.fire({
        added: [],
        changed: [],
        removed: [session],
      });
    }
  }
}
