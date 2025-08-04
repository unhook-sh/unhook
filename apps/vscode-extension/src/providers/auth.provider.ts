import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';
import { env } from '../env';
import type { AuthStore } from '../services/auth.service';

const log = debug('unhook:vscode:auth-provider');

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
    log('UnhookAuthProvider.createSession called');

    try {
      // Open browser for auth
      const authUrl = new URL(
        '/app/auth-code',
        ConfigManager.getInstance().getApiUrl(),
      );
      const editorScheme = this.getEditorUriScheme();
      const redirectUri = `${editorScheme}://${env.NEXT_PUBLIC_VSCODE_EXTENSION_ID}`;

      authUrl.searchParams.set('redirectTo', redirectUri);
      authUrl.searchParams.set('source', 'extension');

      log('Auth URL constructed:', {
        baseUrl: ConfigManager.getInstance().getApiUrl(),
        editorScheme,
        fullUrl: authUrl.toString(),
        redirectUri,
      });

      // Create a promise that will be resolved by the URI handler
      const authPromise = new Promise<vscode.AuthenticationSession>(
        (resolve, reject) => {
          log('Setting up pending auth promise');
          this._pendingAuth = { reject, resolve };

          // Set a timeout in case the auth flow fails
          setTimeout(() => {
            if (this._pendingAuth) {
              log('Authentication timed out after 2 minutes');
              this._pendingAuth = undefined;
              reject(new Error('Authentication timed out'));
            }
          }, 120000); // 2 minute timeout
        },
      );

      log('Opening browser for authentication');
      // Open the browser
      await vscode.env.openExternal(vscode.Uri.parse(authUrl.toString()));

      log('Waiting for auth completion...');
      // Wait for the auth to complete
      const session = await authPromise;

      log('Auth session received, firing session change event');
      this._onDidChangeSessions.fire({
        added: [session],
        changed: [],
        removed: [],
      });

      return session;
    } catch (error) {
      log('Failed to create authentication session:', error);
      vscode.window.showErrorMessage(
        `Failed to create authentication session: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // Method to be called by the URI handler when auth is complete
  async completeAuth(code: string): Promise<void> {
    log(
      'UnhookAuthProvider.completeAuth called with code:',
      `${code?.substring(0, 10)}...`,
    );

    if (!this._pendingAuth) {
      log('No pending auth flow found');
      // No pending auth flow - this might happen if the user tries to auth without clicking the button
      vscode.window.showWarningMessage(
        'No pending authentication request found. Please try signing in again.',
      );
      return;
    }

    log('Found pending auth, attempting to exchange code');

    try {
      // Exchange the auth code
      log('Calling authStore.exchangeAuthCode');
      const { authToken, sessionId, user } =
        await this.authStore.exchangeAuthCode({ code });

      log('Auth code exchange successful:', {
        hasAuthToken: !!authToken,
        hasSessionId: !!sessionId,
        userId: user.id,
      });

      const session: vscode.AuthenticationSession = {
        accessToken: authToken,
        account: {
          id: user.id,
          label: user.email ?? '',
        },
        id: sessionId,
        scopes: UnhookAuthProvider.SCOPES,
      };

      log('Resolving pending auth promise');
      // Resolve the pending auth promise
      this._pendingAuth.resolve(session);
      this._pendingAuth = undefined;

      // Show success message
      vscode.window.showInformationMessage('Successfully signed in to Unhook');
      log('Auth completion successful');
    } catch (error) {
      log('Error during auth completion:', error);
      this._pendingAuth?.reject(error as Error);
      this._pendingAuth = undefined;

      // Show error message to user
      vscode.window.showErrorMessage(
        `Authentication failed: ${(error as Error).message}`,
      );
    }
  }

  async removeSession(_sessionId: string): Promise<void> {
    log('removeSession called');

    // Always sign out from the auth store first
    await this.authStore.signOut();

    // Try to get the session for notification purposes, but don't fail if we can't
    let session: vscode.AuthenticationSession | undefined;
    try {
      session = await this.getSession(UnhookAuthProvider.SCOPES);
    } catch (error) {
      log(
        'Failed to get session during sign out, but continuing with sign out',
        { error },
      );
    }

    // If we couldn't get the session from getSession, construct one from stored data
    if (!session && this.authStore.sessionId) {
      session = {
        accessToken: this.authStore.authToken ?? '',
        account: {
          id: this.authStore.user?.id ?? '',
          label: this.authStore.user?.email ?? '',
        },
        id: this.authStore.sessionId,
        scopes: UnhookAuthProvider.SCOPES,
      };
    }

    // Always fire the session change event to notify VS Code
    if (session) {
      this._onDidChangeSessions.fire({
        added: [],
        changed: [],
        removed: [session],
      });
    } else {
      // Even if we don't have a session object, fire the event to clear any cached sessions
      this._onDidChangeSessions.fire({
        added: [],
        changed: [],
        removed: [],
      });
    }

    log('Sign out completed');
  }
}
