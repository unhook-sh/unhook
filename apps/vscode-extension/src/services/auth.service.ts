import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { type ApiClient, type AuthUser, createApiClient } from '../api';
import { ConfigManager } from '../config.manager';

const TOKEN_KEY = 'unhook.auth.token';
const SESSION_ID_KEY = 'unhook.auth.sessionId';

// Create debug logger for auth store
const log = debug('unhook:vscode:auth');

export class AuthStore implements vscode.Disposable {
  private _onDidChangeAuth = new vscode.EventEmitter<void>();
  readonly onDidChangeAuth = this._onDidChangeAuth.event;

  private _isSignedIn = false;
  private _authToken: string | null = null;
  private _sessionId: string | null = null;
  private _user: AuthUser | null = null;
  private _isValidatingSession = false;
  private _api: ApiClient;
  private _configManager: ConfigManager;

  constructor(private readonly context: vscode.ExtensionContext) {
    // Initialize ConfigManager
    this._configManager = ConfigManager.getInstance();

    // Create API client with the base URL from ConfigManager
    this._api = createApiClient({
      baseUrl: this._configManager.getApiUrl(),
    });
  }

  get isSignedIn() {
    return this._isSignedIn;
  }

  get authToken() {
    return this._authToken;
  }

  get sessionId() {
    return this._sessionId;
  }

  get user() {
    return this._user;
  }

  get isValidatingSession() {
    return this._isValidatingSession;
  }

  get api(): ApiClient {
    return this._api;
  }

  async exchangeAuthCode({ code }: { code: string }) {
    const { authToken, sessionId, user } =
      await this._api.auth.exchangeAuthCode.mutate({ code });
    await this.setAuthToken({ token: authToken });
    await this.setSessionId({ sessionId });
    this.setUser(user);
    return { authToken, sessionId, user };
  }

  async setAuthToken({ token }: { token: string | null }) {
    log('Setting auth token', { hasToken: !!token });
    if (token) {
      await this.context.secrets.store(TOKEN_KEY, token);
    } else {
      await this.context.secrets.delete(TOKEN_KEY);
    }

    this._authToken = token;
    this._isSignedIn = !!token;
    // Create API client with auth token and base URL
    this._api = createApiClient({
      authToken: token ?? undefined,
      baseUrl: this._configManager.getApiUrl(),
    });
    this._onDidChangeAuth.fire();
    log('Auth token updated', { isSignedIn: this._isSignedIn });
  }

  async setSessionId({ sessionId }: { sessionId: string | null }) {
    log('Setting session ID', { hasSessionId: !!sessionId });
    if (sessionId) {
      await this.context.secrets.store(SESSION_ID_KEY, sessionId);
    } else {
      await this.context.secrets.delete(SESSION_ID_KEY);
    }

    this._sessionId = sessionId;
    this._onDidChangeAuth.fire();
    log('Session ID updated');
  }

  setUser(user: AuthUser | null) {
    log('Setting user', { hasUser: !!user, userId: user?.id });
    this._user = user;
    this._onDidChangeAuth.fire();
  }

  setValidatingSession(isValidating: boolean) {
    log('Setting validating session state', { isValidating });
    this._isValidatingSession = isValidating;
    this._onDidChangeAuth.fire();
  }

  async signOut() {
    log('Signing out user');
    await this.setAuthToken({ token: null });
    await this.setSessionId({ sessionId: null });
    this.setUser(null);
    log('User signed out');
  }

  async validateSession(): Promise<boolean> {
    if (!this._authToken || !this._sessionId) {
      log('Cannot validate session - missing token or session ID', {
        hasSessionId: !!this._sessionId,
        hasToken: !!this._authToken,
      });
      return false;
    }

    log('Validating session');
    this.setValidatingSession(true);

    try {
      const { user } = await this._api.auth.verifySessionToken.query({
        sessionId: this._sessionId,
      });

      this.setUser(user);
      log('Session validated successfully', { userId: user.id });
      return true;
    } catch (error) {
      log('Session validation failed', { error });
      await this.signOut();
      return false;
    } finally {
      this.setValidatingSession(false);
    }
  }

  async initialize() {
    log('Initializing auth store');
    const [token, sessionId] = await Promise.all([
      this.context.secrets.get(TOKEN_KEY),
      this.context.secrets.get(SESSION_ID_KEY),
    ]);

    log('Retrieved stored credentials', {
      hasSessionId: !!sessionId,
      hasToken: !!token,
    });

    if (token) {
      await this.setAuthToken({ token });
    }
    if (sessionId) {
      await this.setSessionId({ sessionId });
    }

    // Validate session if we have both token and sessionId
    if (token && sessionId) {
      await this.validateSession();
    }
    log('Auth store initialization complete');
  }

  dispose() {
    log('Disposing auth store');
    this._onDidChangeAuth.dispose();
  }
}
