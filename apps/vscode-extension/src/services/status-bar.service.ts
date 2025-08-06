import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { isDeliveryEnabled } from '../commands/delivery.commands';
import { ConfigManager } from '../config.manager';
import type { UnhookAuthProvider } from '../providers/auth.provider';
import type { AuthStore } from './auth.service';
import type { PollingState } from './polling.service';
import { SettingsService } from './settings.service';
import { WebhookAuthorizationService } from './webhook-authorization.service';

const log = debug('unhook:vscode:status-bar');

export interface StatusBarItemConfig {
  showPollingStatus: boolean;
  showLastEventTime: boolean;
  showPollingInterval: boolean;
}

export class StatusBarService implements vscode.Disposable {
  private static instance: StatusBarService;
  private statusBarItem: vscode.StatusBarItem;
  private authStore: AuthStore | null = null;
  private authProvider: UnhookAuthProvider | null = null;
  private authorizationService: WebhookAuthorizationService;
  private disposables: vscode.Disposable[] = [];

  // Polling-related properties
  private pollingState: PollingState | null = null;
  private settingsService: SettingsService;
  private config: StatusBarItemConfig = {
    showLastEventTime: true,
    showPollingInterval: true,
    showPollingStatus: true,
  };

  private constructor() {
    log('Initializing StatusBarService');

    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );

    this.authorizationService = WebhookAuthorizationService.getInstance();
    this.settingsService = SettingsService.getInstance();

    // Listen for authorization state changes
    const authStateDisposable =
      this.authorizationService.onDidChangeAuthorizationState(() =>
        this.update(),
      );
    this.disposables.push(authStateDisposable);

    // Listen for delivery setting changes
    const configDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('unhook.delivery.enabled')) {
        this.update();
      }
    });
    this.disposables.push(configDisposable);

    // Load initial polling settings
    this.loadSettings();

    // Listen for polling settings changes
    this.settingsService.onConfigurationChange(() => {
      this.loadSettings();
    });
  }

  public static getInstance(): StatusBarService {
    if (!StatusBarService.instance) {
      StatusBarService.instance = new StatusBarService();
    }
    return StatusBarService.instance;
  }

  setAuthStore(authStore: AuthStore) {
    this.authStore = authStore;

    // Listen for auth state changes
    const authDisposable = authStore.onDidChangeAuth(() => {
      this.update();
      this.checkWebhookAuthorization();
    });
    this.disposables.push(authDisposable);

    this.update();
    this.checkWebhookAuthorization();
  }

  setAuthProvider(authProvider: UnhookAuthProvider) {
    this.authProvider = authProvider;

    // Listen for pending auth state changes
    const pendingAuthDisposable = authProvider.onDidChangePendingAuth(() =>
      this.update(),
    );
    this.disposables.push(pendingAuthDisposable);

    this.update();
  }

  /**
   * Load settings from VS Code configuration
   */
  private loadSettings(): void {
    const statusBarSettings = this.settingsService.getStatusBarSettings();

    this.config = {
      showLastEventTime: statusBarSettings.showLastEventTime,
      showPollingInterval: statusBarSettings.showPollingInterval,
      showPollingStatus: statusBarSettings.showPollingStatus,
    };

    log('Status bar settings loaded', this.config);
  }

  /**
   * Update the status bar with polling state
   */
  public updatePollingState(state: PollingState): void {
    this.pollingState = state;
    this.update();
  }

  /**
   * Set configuration for status bar items
   */
  public setConfig(config: Partial<StatusBarItemConfig>): void {
    this.config = { ...this.config, ...config };
    this.update();
  }

  /**
   * Check webhook authorization using the API
   */
  private async checkWebhookAuthorization(): Promise<void> {
    if (!this.authStore?.isSignedIn || !this.authStore.api) {
      return;
    }

    try {
      // Get webhook ID from config
      const configManager = ConfigManager.getInstance();
      const webhookId = configManager.getConfig()?.webhookId;

      if (!webhookId) {
        return;
      }

      // Check if user is authorized for this webhook
      const isAuthorized = await this.authStore.api.webhooks.authorized.query({
        id: webhookId,
      });

      if (!isAuthorized) {
        // User is not authorized, trigger authorization error handling
        this.authorizationService.handleAuthorizationError(
          webhookId,
          this.authStore,
        );
      } else {
        // User is authorized, clear any unauthorized state
        this.authorizationService.handleAuthorizationSuccess();
      }
    } catch (error) {
      log('Error checking webhook authorization:', error);
    }
  }

  update() {
    if (!this.authStore) {
      return;
    }

    const deliveryEnabled = isDeliveryEnabled();
    const deliveryIcon = deliveryEnabled ? '$(play)' : '$(debug-pause)';
    const deliveryStatus = deliveryEnabled ? 'enabled' : 'paused';
    const authState = this.authorizationService.getState();

    if (this.authStore.isValidatingSession) {
      this.statusBarItem.text = '$(sync~spin) Validating Unhook Session...';
      this.statusBarItem.tooltip = 'Validating your Unhook session...';
      this.statusBarItem.command = undefined;
    } else if (this.authStore.isSignedIn) {
      // Check if webhook is unauthorized
      if (authState.isUnauthorized) {
        if (authState.hasPendingRequest) {
          this.statusBarItem.text = '$(clock) Unhook: Access pending';
          this.statusBarItem.tooltip =
            'Your webhook access request is pending approval';
          this.statusBarItem.command = undefined;
        } else {
          this.statusBarItem.text = '$(error) Unhook: No webhook access';
          this.statusBarItem.tooltip =
            'You do not have access to this webhook\nClick to request access';
          this.statusBarItem.command = 'unhook.requestWebhookAccess';
        }
      } else {
        // User is signed in and has access - show polling status if available
        if (this.pollingState && this.config.showPollingStatus) {
          this.updatePollingStatus(deliveryIcon, deliveryStatus);
        } else {
          this.statusBarItem.text = `$(check) Unhook ${deliveryIcon}`;
          this.statusBarItem.tooltip = `Unhook connected • Event forwarding ${deliveryStatus}\nClick to open Quick Actions`;
          this.statusBarItem.command = 'unhook.showQuickPick';
        }
      }
    } else {
      // Check if authentication is pending
      const isAuthPending = this.authProvider?.isAuthPending() ?? false;

      if (isAuthPending) {
        this.statusBarItem.text = '$(close) Cancel Sign In...';
        this.statusBarItem.tooltip =
          'Authentication in progress • Click to cancel sign in to Unhook';
        this.statusBarItem.command = 'unhook.cancelAuth';
      } else {
        this.statusBarItem.text = '$(sign-in) Sign in to Unhook';
        this.statusBarItem.tooltip = 'Click to sign in to Unhook';
        this.statusBarItem.command = 'unhook.signIn';
      }
    }

    this.statusBarItem.show();
  }

  /**
   * Update status bar with polling information
   */
  private updatePollingStatus(
    deliveryIcon: string,
    deliveryStatus: string,
  ): void {
    if (!this.pollingState) {
      return;
    }

    const { isPolling, isPaused, lastEventTime, pollingInterval } =
      this.pollingState;

    // Build status text
    const parts: string[] = [];

    // Polling status indicator
    if (this.config.showPollingStatus) {
      if (isPolling) {
        parts.push('$(sync~spin)');
      } else if (isPaused) {
        parts.push('$(debug-pause)');
      } else {
        parts.push('$(debug-stop)');
      }
    }

    // Add delivery status
    parts.push(`Unhook ${deliveryIcon}`);

    // Polling interval
    if (this.config.showPollingInterval && isPolling) {
      const intervalSeconds = Math.round(pollingInterval / 1000);
      parts.push(`${intervalSeconds}s`);
    }

    // Last event time
    if (this.config.showLastEventTime && lastEventTime) {
      const timeAgo = this.getTimeAgo(lastEventTime);
      parts.push(`Last: ${timeAgo}`);
    } else if (this.config.showLastEventTime && !lastEventTime) {
      parts.push('No events');
    }

    // Set the status bar text
    this.statusBarItem.text = parts.join(' ');

    // Update tooltip
    this.updatePollingTooltip(deliveryStatus);

    // Update command based on polling state
    this.updatePollingCommand();
  }

  /**
   * Update the tooltip text for polling status
   */
  private updatePollingTooltip(deliveryStatus: string): void {
    if (!this.pollingState) {
      return;
    }

    const {
      isPolling,
      isPaused,
      lastEventTime,
      pollingInterval,
      lastPollTime,
    } = this.pollingState;

    const tooltipParts: string[] = [];

    // Polling status
    if (isPolling) {
      tooltipParts.push('🔄 Polling active');
    } else if (isPaused) {
      tooltipParts.push('⏸️ Polling paused');
    } else {
      tooltipParts.push('⏹️ Polling stopped');
    }

    // Delivery status
    tooltipParts.push(`Event forwarding ${deliveryStatus}`);

    // Polling interval
    const intervalSeconds = Math.round(pollingInterval / 1000);
    tooltipParts.push(`Interval: ${intervalSeconds} seconds`);

    // Last event time
    if (lastEventTime) {
      const timeAgo = this.getTimeAgo(lastEventTime);
      tooltipParts.push(`Last event: ${timeAgo}`);
    } else {
      tooltipParts.push('No events received yet');
    }

    // Last poll time
    if (lastPollTime) {
      const pollTimeAgo = this.getTimeAgo(lastPollTime);
      tooltipParts.push(`Last poll: ${pollTimeAgo}`);
    }

    // Click instruction
    if (isPaused) {
      tooltipParts.push('Click to resume polling');
    } else if (isPolling) {
      tooltipParts.push('Click to pause polling');
    } else {
      tooltipParts.push('Click to start polling');
    }

    this.statusBarItem.tooltip = tooltipParts.join('\n');
  }

  /**
   * Update the command based on polling state
   */
  private updatePollingCommand(): void {
    if (!this.pollingState) {
      this.statusBarItem.command = 'unhook.showQuickPick';
      return;
    }

    const { isPolling, isPaused } = this.pollingState;

    if (isPaused) {
      this.statusBarItem.command = 'unhook.resumePolling';
      return;
    }

    if (isPolling) {
      this.statusBarItem.command = 'unhook.pausePolling';
      return;
    }

    this.statusBarItem.command = 'unhook.startPolling';
  }

  /**
   * Get a human-readable time ago string
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    }

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  dispose() {
    log('Disposing StatusBarService');
    this.statusBarItem.dispose();

    // Dispose all event listeners
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
