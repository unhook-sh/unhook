import { randomUUID } from 'node:crypto';
import {
  capture,
  captureException,
  initializePostHog,
  pageView,
  setSessionId,
  setUser,
  shutdown,
} from '@unhook/analytics/posthog/vscode';
import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';
import type { AuthStore } from './auth.service';

const log = debug('unhook:vscode:analytics');
const SESSION_ID_KEY = 'unhook.analytics.sessionId';

export class AnalyticsService implements vscode.Disposable {
  private static instance: AnalyticsService | null = null;
  private sessionId: string;
  private authStore: AuthStore;
  private context: vscode.ExtensionContext;
  private _isInitialized = false;

  private constructor(context: vscode.ExtensionContext, authStore: AuthStore) {
    this.context = context;
    this.authStore = authStore;

    // Get or create session ID
    this.sessionId = this.getOrCreateSessionId();
    setSessionId(this.sessionId);

    // Initialize PostHog
    this.initialize();

    // Listen for auth changes
    this.authStore.onDidChangeAuth(() => {
      this.updateUser();
    });

    // Set initial user if already signed in
    if (this.authStore.isSignedIn && this.authStore.user) {
      this.updateUser();
    }
  }

  /**
   * Get VS Code common properties for analytics
   */
  private getVSCodeCommonProperties(): Record<string, unknown> {
    return {
      // Extension properties
      'common.extname': this.context.extension.packageJSON.name,
      'common.extversion': this.context.extension.packageJSON.version,
      'common.nodeArch': process.arch,

      // OS and Platform properties
      'common.os': process.platform,
      'common.platformversion': process.version,
      'common.product': vscode.env.appName,
      'common.remotename': vscode.env.remoteName || 'local',
      'common.uikind':
        vscode.env.uiKind === vscode.UIKind.Web ? 'Web' : 'Desktop',

      // VS Code properties
      'common.vscodemachineid': vscode.env.machineId,
      'common.vscodesessionid': vscode.env.sessionId,
      'common.vscodeversion': vscode.version,
    };
  }

  static getInstance(
    context: vscode.ExtensionContext,
    authStore: AuthStore,
  ): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService(context, authStore);
    }
    return AnalyticsService.instance;
  }

  private getOrCreateSessionId(): string {
    const existingId = this.context.globalState.get<string>(SESSION_ID_KEY);
    if (existingId) {
      return existingId;
    }

    const newId = randomUUID();
    this.context.globalState.update(SESSION_ID_KEY, newId);
    return newId;
  }

  private initialize() {
    // Check if VS Code telemetry is disabled - if so, don't initialize analytics
    if (!vscode.env.isTelemetryEnabled) {
      log('VS Code telemetry is disabled, analytics not initialized');
      return;
    }

    const configManager = ConfigManager.getInstance();
    const isEnabled = configManager.isAnalyticsEnabled();

    if (!isEnabled) {
      log('Analytics disabled by user preference');
      return;
    }

    initializePostHog(true);

    this._isInitialized = true;
    log('Analytics initialized');
  }

  /**
   * Reinitialize analytics when user changes their preference
   */
  public reinitialize(): void {
    // Check if VS Code telemetry is disabled - if so, disable analytics
    if (!vscode.env.isTelemetryEnabled) {
      if (this._isInitialized) {
        this._isInitialized = false;
        log('Analytics disabled due to VS Code telemetry being disabled');
      }
      return;
    }

    const configManager = ConfigManager.getInstance();
    const isEnabled = configManager.isAnalyticsEnabled();

    if (isEnabled && !this._isInitialized) {
      // User enabled analytics
      this.initialize();
    } else if (!isEnabled && this._isInitialized) {
      // User disabled analytics
      this._isInitialized = false;
      log('Analytics disabled by user preference');
    }
  }

  private updateUser() {
    if (this.authStore.isSignedIn && this.authStore.user) {
      setUser({
        email: this.authStore.user.email ?? undefined,
        id: this.authStore.user.id,
      });

      // Track sign in event
      this.track('user_signed_in', {
        method: 'vscode',
      });
    } else {
      setUser(null);

      // Track sign out event
      this.track('user_signed_out');
    }
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Track a custom event
   */
  track(event: string, properties?: Record<string, unknown>) {
    if (!this._isInitialized) {
      return;
    }

    capture(event, {
      properties: {
        ...this.getVSCodeCommonProperties(),
        ...properties,
        extension_version: this.context.extension.packageJSON.version,
        platform: process.platform,
        vscode_version: vscode.version,
      },
    });
  }

  /**
   * Track a page/view change
   */
  trackPageView(view: string, properties?: Record<string, unknown>) {
    if (!this._isInitialized) {
      return;
    }

    pageView(view, {
      ...this.getVSCodeCommonProperties(),
      ...properties,
      extension_version: this.context.extension.packageJSON.version,
    });
  }

  /**
   * Track an exception
   */
  trackException(error: Error, context?: Record<string, unknown>) {
    captureException(error, {
      ...this.getVSCodeCommonProperties(),
      ...context,
      extension_version: this.context.extension.packageJSON.version,
      platform: process.platform,
      vscode_version: vscode.version,
    });
  }

  /**
   * Track command execution
   */
  trackCommand(command: string, properties?: Record<string, unknown>) {
    this.track('command_executed', {
      command,
      ...properties,
    });
  }

  /**
   * Track webhook event received
   */
  trackWebhookEvent(
    provider: string,
    event: string,
    properties?: Record<string, unknown>,
  ) {
    this.track('webhook_event_received', {
      event,
      provider,
      ...properties,
    });
  }

  /**
   * Track configuration change
   */
  trackConfigChange(setting: string, value: unknown) {
    this.track('config_changed', {
      setting,
      value,
    });
  }

  /**
   * Track extension activation
   */
  trackActivation(activationTime: number) {
    this.track('extension_activated', {
      activation_time_ms: activationTime,
      has_config_file: ConfigManager.getInstance().hasConfigFile(),
      workspace_folders: vscode.workspace.workspaceFolders?.length ?? 0,
    });
  }

  /**
   * Track extension deactivation
   */
  trackDeactivation() {
    this.track('extension_deactivated');
  }

  async dispose() {
    log('Disposing analytics service');
    await shutdown();
    AnalyticsService.instance = null;
  }
}
