import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { type ApiClient, type AuthUser, createApiClient } from '../api';
import { ConfigManager } from '../config.manager';

const TOKEN_KEY_BASE = 'unhook.auth.token';
const SESSION_ID_KEY_BASE = 'unhook.auth.sessionId';

// Create debug logger for auth store
const log = debug('unhook:vscode:auth');

export class AuthStore implements vscode.Disposable {
  private _onDidChangeAuth = new vscode.EventEmitter<void>();
  readonly onDidChangeAuth = this._onDidChangeAuth.event;

  private _isSignedIn = false;
  private _authToken: string | null = null;
  private _supabaseToken: string | null = null;
  private _sessionId: string | null = null;
  private _user: AuthUser | null = null;
  private _isValidatingSession = false;
  private _api: ApiClient;
  private _configManager: ConfigManager;
  private _sessionRefreshTimer: NodeJS.Timeout | null = null;
  private readonly SESSION_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
  private _lastValidationTime = 0;
  private readonly MIN_VALIDATION_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes minimum between validations

  constructor(private readonly context: vscode.ExtensionContext) {
    // Initialize ConfigManager
    this._configManager = ConfigManager.getInstance();

    // Create API client with the base URL from ConfigManager
    this._api = createApiClient({
      baseUrl: this._configManager.getApiUrl(),
    });
  }

  private getTokenKey(): string {
    // Namespace auth token by environment to avoid re-auth when switching
    const suffix = this._configManager.isDevelopment() ? 'dev' : 'prod';
    return `${TOKEN_KEY_BASE}.${suffix}`;
  }

  private getSessionIdKey(): string {
    const suffix = this._configManager.isDevelopment() ? 'dev' : 'prod';
    return `${SESSION_ID_KEY_BASE}.${suffix}`;
  }

  get isSignedIn() {
    return this._isSignedIn;
  }

  get authToken() {
    return this._authToken;
  }

  get supabaseToken() {
    return this._supabaseToken;
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

    // Set all auth data without firing events
    await this.setAuthTokenInternal({ token: authToken });
    await this.setSessionIdInternal({ sessionId });
    this.setUserInternal(user);

    // Get Supabase token for realtime connections
    try {
      const { authToken: supabaseToken } =
        await this._api.auth.verifySessionToken.query({
          sessionId,
          sessionTemplate: 'supabase',
        });
      await this.setSupabaseTokenInternal({ token: supabaseToken });
    } catch (error) {
      log('Failed to get Supabase token during auth code exchange:', error);
    }

    // Start periodic session refresh to keep tokens fresh
    this.startPeriodicSessionRefresh();
    log('Periodic session refresh started');

    // Fire one auth change event after everything is set
    this._onDidChangeAuth.fire();

    return { authToken, sessionId, user };
  }

  async setAuthToken({ token }: { token: string | null }) {
    await this.setAuthTokenInternal({ token });
    this._onDidChangeAuth.fire();
  }

  private async setAuthTokenInternal({ token }: { token: string | null }) {
    if (token) {
      await this.context.secrets.store(this.getTokenKey(), token);
    } else {
      await this.context.secrets.delete(this.getTokenKey());
    }

    this._authToken = token;
    this._isSignedIn = !!token;
    // Create API client with auth token and base URL
    this._api = createApiClient({
      authToken: token ?? undefined,
      baseUrl: this._configManager.getApiUrl(),
    });
    log('Auth token updated', { isSignedIn: this._isSignedIn });
  }

  private async setSupabaseTokenInternal({ token }: { token: string | null }) {
    log('Setting Supabase token', { hasToken: !!token });
    this._supabaseToken = token;
  }

  async setSessionId({ sessionId }: { sessionId: string | null }) {
    await this.setSessionIdInternal({ sessionId });
    this._onDidChangeAuth.fire();
  }

  private async setSessionIdInternal({
    sessionId,
  }: {
    sessionId: string | null;
  }) {
    if (sessionId) {
      await this.context.secrets.store(this.getSessionIdKey(), sessionId);
    } else {
      await this.context.secrets.delete(this.getSessionIdKey());
    }

    this._sessionId = sessionId;
  }

  setUser(user: AuthUser | null) {
    this.setUserInternal(user);
    this._onDidChangeAuth.fire();
  }

  private setUserInternal(user: AuthUser | null) {
    this._user = user;
  }

  setValidatingSession(isValidating: boolean) {
    this._isValidatingSession = isValidating;
    this._onDidChangeAuth.fire();
  }

  async signOut() {
    log('Signing out user');
    this.stopPeriodicSessionRefresh();
    await this.setAuthTokenInternal({ token: null });
    await this.setSupabaseTokenInternal({ token: null });
    await this.setSessionIdInternal({ sessionId: null });
    this.setUserInternal(null);
    // This will trigger EventsProvider to clear cached events via onDidChangeAuth
    this._onDidChangeAuth.fire();
    log('User signed out');
  }

  async validateSession(isInitialization = false): Promise<boolean> {
    if (!this._authToken || !this._sessionId) {
      log('Cannot validate session - missing token or session ID', {
        hasSessionId: !!this._sessionId,
        hasToken: !!this._authToken,
      });
      return false;
    }

    // Debounce validation calls to prevent rapid successive validations
    const now = Date.now();
    if (
      !isInitialization &&
      now - this._lastValidationTime < this.MIN_VALIDATION_INTERVAL_MS
    ) {
      log('Validation skipped due to debouncing', {
        minInterval: this.MIN_VALIDATION_INTERVAL_MS,
        timeSinceLastValidation: now - this._lastValidationTime,
      });
      return this._isSignedIn; // Return current state without validating
    }

    log('Validating session', {
      caller: new Error().stack?.split('\n')[2]?.trim() || 'unknown',
      isInitialization,
    });
    this.setValidatingSession(true);
    this._lastValidationTime = now;

    try {
      // First, validate the regular session token for API calls
      const { user, authToken } = await this._api.auth.verifySessionToken.query(
        {
          sessionId: this._sessionId,
          sessionTemplate: 'cli',
        },
      );

      // Update the auth token with the fresh one for API calls
      if (authToken) {
        await this.setAuthTokenInternal({ token: authToken });
      }

      // Then, get a separate Supabase token for realtime connections
      const { authToken: supabaseToken } =
        await this._api.auth.verifySessionToken.query({
          sessionId: this._sessionId,
          sessionTemplate: 'supabase',
        });

      // Store the Supabase token separately
      if (supabaseToken) {
        await this.setSupabaseTokenInternal({ token: supabaseToken });
      }

      this.setUserInternal(user);
      log('Session validated successfully', { userId: user.id });
      return true;
    } catch (error) {
      log('Session validation failed', { error, isInitialization });

      // During initialization, be more lenient - don't immediately sign out
      // This prevents logout on workspace reload due to temporary network issues
      if (isInitialization) {
        log(
          'Keeping existing session during initialization despite validation failure',
        );
        // Keep the user signed in with existing tokens, but mark validation as failed
        return false;
      }
      // For non-initialization validation (user-triggered), be more strict
      await this.signOut();
      return false;
    } finally {
      this.setValidatingSession(false);
    }
  }

  async initialize() {
    const [token, sessionId] = await Promise.all([
      this.context.secrets.get(this.getTokenKey()),
      this.context.secrets.get(this.getSessionIdKey()),
    ]);

    if (token) {
      await this.setAuthTokenInternal({ token });
    }
    if (sessionId) {
      await this.setSessionIdInternal({ sessionId });
    }

    // Validate session if we have both token and sessionId
    // Pass isInitialization=true to be more lenient during startup
    if (token && sessionId) {
      const validationResult = await this.validateSession(true);
      if (!validationResult) {
        log(
          'Session validation failed during initialization, but keeping user signed in',
        );
        // Even though validation failed, we'll keep the user signed in with existing tokens
        // This prevents logout on workspace reload due to network issues
      }

      // Start periodic session refresh if we have valid credentials
      if (this._isSignedIn) {
        this.startPeriodicSessionRefresh();
      }
    }

    // Fire one auth change event after initialization
    this._onDidChangeAuth.fire();

    log('Auth store initialization complete', {
      hasSessionId: !!sessionId,
      hasToken: !!token,
      isSignedIn: this._isSignedIn,
    });
  }

  /**
   * Manually validate and refresh the session (more strict than initialization)
   */
  async refreshSession(): Promise<boolean> {
    return this.validateSession(false);
  }

  /**
   * Start periodic session refresh to keep tokens fresh
   */
  private startPeriodicSessionRefresh() {
    this.stopPeriodicSessionRefresh();

    if (this._isSignedIn && this._sessionId) {
      log('Starting periodic session refresh');
      this._sessionRefreshTimer = setInterval(async () => {
        if (this._isSignedIn && this._sessionId && !this._isValidatingSession) {
          log('Performing periodic session refresh');
          try {
            // Use lenient validation to avoid logging out on temporary issues
            await this.validateSession(true);
          } catch (error) {
            log('Periodic session refresh failed, but continuing', { error });
          }
        }
      }, this.SESSION_REFRESH_INTERVAL_MS);
    }
  }

  /**
   * Stop periodic session refresh
   */
  private stopPeriodicSessionRefresh() {
    if (this._sessionRefreshTimer) {
      clearInterval(this._sessionRefreshTimer);
      this._sessionRefreshTimer = null;
      log('Stopped periodic session refresh');
    }
  }

  dispose() {
    log('Disposing auth store');
    this.stopPeriodicSessionRefresh();
    this._onDidChangeAuth.dispose();
  }
}
