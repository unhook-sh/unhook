import type { EventTypeWithRequest } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import type { AuthStore } from './auth.service';
import { SettingsService } from './settings.service';

const log = debug('unhook:vscode:polling');

export interface PollingState {
  isPolling: boolean;
  isPaused: boolean;
  lastEventTime: Date | null;
  pollingInterval: number;
  autoPauseTimeout: number;
  lastPollTime: Date | null;
  errorCount: number;
  consecutiveErrors: number;
}

export interface PollingServiceOptions {
  authStore: AuthStore;
  onStateChange?: (state: PollingState) => void;
  onError?: (error: Error) => void;
}

export class PollingService implements vscode.Disposable {
  private authStore: AuthStore;
  private onStateChangeCallback?: (state: PollingState) => void;
  private onError?: (error: Error) => void;
  private settingsService: SettingsService;

  // Event emitters
  private _onEventsReceived = new vscode.EventEmitter<EventTypeWithRequest[]>();
  readonly onEventsReceived = this._onEventsReceived.event;

  // State management
  private state: PollingState = {
    autoPauseTimeout: 600000, // 10 minutes default
    consecutiveErrors: 0,
    errorCount: 0,
    isPaused: false,
    isPolling: false,
    lastEventTime: null,
    lastPollTime: null,
    pollingInterval: 5000, // 5 seconds default
  };

  // Timers
  private pollingTimer: NodeJS.Timeout | null = null;
  private autoPauseTimer: NodeJS.Timeout | null = null;
  private retryTimer: NodeJS.Timeout | null = null;

  // Configuration
  private readonly RETRY_DELAY_MS = 1000;
  private readonly MAX_CONSECUTIVE_ERRORS = 5;

  // Event tracking
  private lastEventIds = new Set<string>();
  private currentWebhookUrl: string | null = null;

  constructor(options: PollingServiceOptions) {
    this.authStore = options.authStore;
    this.onStateChangeCallback = options.onStateChange;
    this.onError = options.onError;
    this.settingsService = SettingsService.getInstance();

    // Load initial settings
    this.loadSettings();

    // Listen for settings changes
    this.settingsService.onConfigurationChange(() => {
      this.loadSettings();
    });

    log('PollingService initialized', {
      autoPauseTimeout: this.state.autoPauseTimeout,
      pollingInterval: this.state.pollingInterval,
    });
  }

  /**
   * Load settings from VS Code configuration
   */
  private loadSettings(): void {
    const pollingSettings = this.settingsService.getPollingSettings();

    this.state.pollingInterval = pollingSettings.interval;
    this.state.autoPauseTimeout = pollingSettings.autoPauseTimeout;

    log('Settings loaded', {
      autoPauseEnabled: pollingSettings.autoPauseEnabled,
      autoPauseTimeout: this.state.autoPauseTimeout,
      pollingInterval: this.state.pollingInterval,
    });
  }

  /**
   * Start polling for events
   */
  public startPolling(webhookUrl?: string): void {
    if (this.state.isPolling) {
      log('Polling already active, skipping start request');
      return;
    }

    if (!this.authStore.isSignedIn) {
      log('Cannot start polling: user not signed in');
      return;
    }

    this.currentWebhookUrl = webhookUrl || null;
    this.state.isPolling = true;
    this.state.isPaused = false;
    this.state.consecutiveErrors = 0;

    // Clear event tracking when starting polling for a new webhook
    this.lastEventIds.clear();

    log('Starting polling', {
      interval: this.state.pollingInterval,
      webhookUrl: this.currentWebhookUrl,
    });

    this.scheduleNextPoll();
    this.emitStateChange();
  }

  /**
   * Stop polling completely
   */
  public stopPolling(): void {
    log('Stopping polling');

    this.clearTimers();
    this.state.isPolling = false;
    this.state.isPaused = false;
    this.currentWebhookUrl = null;

    this.emitStateChange();
  }

  /**
   * Pause polling (can be resumed)
   */
  public pausePolling(): void {
    if (!this.state.isPolling || this.state.isPaused) {
      return;
    }

    log('Pausing polling');
    this.clearTimers();
    this.state.isPaused = true;
    this.emitStateChange();
  }

  /**
   * Resume polling after being paused
   */
  public resumePolling(): void {
    if (!this.state.isPolling || !this.state.isPaused) {
      return;
    }

    log('Resuming polling');
    this.state.isPaused = false;
    this.state.consecutiveErrors = 0;
    this.scheduleNextPoll();
    this.emitStateChange();
  }

  /**
   * Check if polling is currently active
   */
  public isPolling(): boolean {
    return this.state.isPolling && !this.state.isPaused;
  }

  /**
   * Check if polling is paused
   */
  public isPaused(): boolean {
    return this.state.isPaused;
  }

  /**
   * Get the last event time
   */
  public getLastEventTime(): Date | null {
    return this.state.lastEventTime;
  }

  /**
   * Get the current polling interval
   */
  public getPollingInterval(): number {
    return this.state.pollingInterval;
  }

  /**
   * Set the polling interval
   */
  public setPollingInterval(interval: number): void {
    if (interval < 2000 || interval > 30000) {
      throw new Error('Polling interval must be between 2 and 30 seconds');
    }

    const wasPolling = this.isPolling();
    if (wasPolling) {
      this.clearTimers();
    }

    this.state.pollingInterval = interval;
    log('Polling interval updated', { interval });

    if (wasPolling) {
      this.scheduleNextPoll();
    }

    this.emitStateChange();
  }

  /**
   * Set the auto-pause timeout
   */
  public setAutoPauseTimeout(timeout: number): void {
    if (timeout < 300000 || timeout > 3600000) {
      throw new Error('Auto-pause timeout must be between 5 and 60 minutes');
    }

    this.state.autoPauseTimeout = timeout;
    log('Auto-pause timeout updated', { timeout });

    // Restart auto-pause timer if currently polling
    if (this.isPolling()) {
      this.scheduleAutoPause();
    }

    this.emitStateChange();
  }

  /**
   * Get the current polling state
   */
  public getState(): PollingState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  public subscribeToStateChange(callback: (state: PollingState) => void): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Perform a single poll for events
   */
  private async performPoll(): Promise<void> {
    if (!this.authStore.isSignedIn || !this.currentWebhookUrl) {
      log('Cannot poll: not signed in or no webhook URL');
      return;
    }

    try {
      log('Performing poll', {
        lastEventTime: this.state.lastEventTime,
        webhookUrl: this.currentWebhookUrl,
      });

      this.state.lastPollTime = new Date();

      // Fetch events from the API
      const events = await this.authStore.api.events.byWebhookUrl.query({
        lastEventTime: this.state.lastEventTime?.toISOString(),
        webhookUrl: this.currentWebhookUrl,
      });

      // Check for new events by comparing event IDs
      const newEvents = events.filter(
        (event) => !this.lastEventIds.has(event.id),
      );

      if (newEvents.length > 0) {
        // Update our tracking set with all current event IDs
        this.lastEventIds.clear();
        for (const event of events) {
          this.lastEventIds.add(event.id);
        }

        this.state.lastEventTime = new Date();
        this.state.consecutiveErrors = 0;

        log('New events received', {
          newCount: newEvents.length,
          newEventIds: newEvents.map((e) => e.id),
          totalEvents: events.length,
        });

        // Emit new events via EventEmitter
        this._onEventsReceived.fire(newEvents);

        // Reset auto-pause timer since we received events
        this.scheduleAutoPause();
      } else {
        log('No new events in this poll', {
          currentCount: events.length,
          trackedIds: this.lastEventIds.size,
        });
      }

      // Schedule next poll
      this.scheduleNextPoll();
    } catch (error) {
      this.handlePollError(error as Error);
    }
  }

  /**
   * Handle polling errors
   */
  private handlePollError(error: Error): void {
    this.state.errorCount++;
    this.state.consecutiveErrors++;

    log('Polling error', {
      consecutiveErrors: this.state.consecutiveErrors,
      error: error.message,
      totalErrors: this.state.errorCount,
    });

    // Emit error event
    this.onError?.(error);

    // Auto-pause if too many consecutive errors
    if (this.state.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      log('Too many consecutive errors, auto-pausing polling');
      this.pausePolling();
      return;
    }

    // Retry with exponential backoff
    const retryDelay =
      this.RETRY_DELAY_MS * 2 ** (this.state.consecutiveErrors - 1);
    log('Scheduling retry', { retryDelay });

    this.retryTimer = setTimeout(() => {
      this.performPoll();
    }, retryDelay);
  }

  /**
   * Schedule the next poll
   */
  private scheduleNextPoll(): void {
    if (!this.state.isPolling || this.state.isPaused) {
      return;
    }

    this.pollingTimer = setTimeout(() => {
      this.performPoll();
    }, this.state.pollingInterval);
  }

  /**
   * Schedule auto-pause timer
   */
  private scheduleAutoPause(): void {
    if (this.autoPauseTimer) {
      clearTimeout(this.autoPauseTimer);
    }

    this.autoPauseTimer = setTimeout(() => {
      log('Auto-pausing polling due to inactivity');
      this.pausePolling();
    }, this.state.autoPauseTimeout);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }

    if (this.autoPauseTimer) {
      clearTimeout(this.autoPauseTimer);
      this.autoPauseTimer = null;
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
   * Emit state change event
   */
  private emitStateChange(): void {
    this.onStateChangeCallback?.(this.getState());
  }

  /**
   * Dispose of the service
   */
  public dispose(): void {
    log('Disposing PollingService');
    this.stopPolling();
    this._onEventsReceived.dispose();
  }
}
