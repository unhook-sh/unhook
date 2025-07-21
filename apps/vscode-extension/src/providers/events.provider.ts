import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  findUpConfig,
  loadConfig,
  type WebhookConfig,
} from '@unhook/client/config';
import {
  createRequestsForEventToAllDestinations,
  handlePendingRequest,
} from '@unhook/client/utils/delivery';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { isDeliveryEnabled } from '../commands/delivery.commands';
import type { AnalyticsService } from '../services/analytics.service';
import type { AuthStore } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { WebhookAuthorizationService } from '../services/webhook-authorization.service';
import { EventItem } from '../tree-items/event.item';
import { RequestItem } from '../tree-items/request.item';
import type { ConfigProvider } from './config.provider';

const log = debug('unhook:vscode:events-provider');

export class EventsProvider
  implements vscode.TreeDataProvider<EventItem | RequestItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    EventItem | RequestItem | undefined
  > = new vscode.EventEmitter<EventItem | RequestItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<
    EventItem | RequestItem | undefined
  > = this._onDidChangeTreeData.event;

  private filterText = '';
  private events: EventTypeWithRequest[] = [];
  private previousEvents: EventTypeWithRequest[] = [];
  public authStore: AuthStore | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 5000; // Increased from 2000 to 5000 to reduce API calls
  private config: WebhookConfig | null = null;
  private configPath: string | null = null;
  private configWatcher: vscode.FileSystemWatcher | null = null;
  private authorizationService: WebhookAuthorizationService;
  private analyticsService: AnalyticsService | null = null;
  private isFetching = false;
  private lastAuthorizationSuccessTime = 0;
  private readonly AUTHORIZATION_SUCCESS_DEBOUNCE_MS = 1000; // 1 second debounce
  private configProvider: ConfigProvider | null = null;

  constructor(private context: vscode.ExtensionContext) {
    log('Initializing EventsProvider');
    this.authorizationService = WebhookAuthorizationService.getInstance();
  }

  public setAnalyticsService(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
  }

  public setAuthStore(authStore: AuthStore) {
    this.authStore = authStore;
    this.authStore.onDidChangeAuth(() => {
      this.refresh();
      this.handlePolling();
    });
    this.refresh();
    this.handlePolling();
  }

  public setConfigProvider(configProvider: ConfigProvider) {
    this.configProvider = configProvider;
  }

  public getCurrentFilter(): string {
    return this.filterText;
  }

  public setFilter(filterText: string) {
    log('Setting filter', { filterText });
    this.filterText = filterText.toLowerCase();
    this._onDidChangeTreeData.fire(undefined);
  }

  public getTreeItem(element: EventItem | RequestItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(
    element?: EventItem | RequestItem,
  ): Promise<(EventItem | RequestItem)[]> {
    if (element instanceof EventItem) {
      // Return requests for this event, or empty array if no requests
      const requests = element.event.requests ?? [];
      return requests.map(
        (request) => new RequestItem(request, element, this.context),
      );
    }

    // if (element instanceof RequestItem) {
    //   // Return request details
    //   // return element.getChildren();
    // }

    // if (element instanceof RequestDetailItem) {
    //   // Return detail item children
    //   return element.children ?? [];
    // }

    // Root level - show auth state or events
    if (!this.authStore) {
      return [];
    }

    if (this.authStore.isValidatingSession) {
      return [];
    }

    if (!this.authStore.isSignedIn) {
      return [];
    }

    // Filter events if needed
    const filteredEvents = this.filterText
      ? this.events.filter(
          (event) =>
            event.id.toLowerCase().includes(this.filterText) ||
            event.source.toLowerCase().includes(this.filterText) ||
            event.status.toLowerCase().includes(this.filterText) ||
            (event.failedReason?.toLowerCase().includes(this.filterText) ??
              false) ||
            event.webhookId.toLowerCase().includes(this.filterText),
        )
      : this.events;

    return filteredEvents.map((event) => new EventItem(event, this.context));
  }

  public refresh(): void {
    log('Refreshing tree data');
    this._onDidChangeTreeData.fire(undefined);
  }

  public refreshAndFetchEvents(): void {
    log('Refreshing and fetching events');
    // Add a small delay to prevent rapid successive calls
    setTimeout(() => {
      this.fetchAndUpdateEvents();
    }, 100);
  }

  public updateEvents(events: EventTypeWithRequest[]): void {
    log('Updating events', { eventCount: events.length });

    // Check if notifications are enabled
    const settings = SettingsService.getInstance().getSettings();
    if (settings.notifications.showForNewEvents) {
      this.checkForNewEventsAndNotify(events);
    }

    // Handle automatic delivery for new events
    if (isDeliveryEnabled() && this.previousEvents.length > 0) {
      this.handleNewEventsDelivery(events);
    }

    // Store previous events for comparison
    this.previousEvents = [...this.events];
    this.events = events;
    this.refresh();
  }

  public dispose() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }
  }

  private checkForNewEventsAndNotify(newEvents: EventTypeWithRequest[]): void {
    if (this.previousEvents.length === 0) {
      // First time loading events, don't show notifications
      return;
    }

    const previousEventIds = this.previousEvents.map((e) => e.id);
    const previousEventMap: Record<string, EventTypeWithRequest> = {};
    for (const event of this.previousEvents) {
      previousEventMap[event.id] = event;
    }

    // Check for new events
    const newEventsOnly = newEvents.filter(
      (event) => previousEventIds.indexOf(event.id) === -1,
    );
    if (newEventsOnly.length > 0) {
      // Track new webhook events
      for (const event of newEventsOnly) {
        this.analyticsService?.trackWebhookEvent(
          event.source,
          'webhook_received',
          {
            event_id: event.id,
            has_requests: (event.requests?.length ?? 0) > 0,
            request_count: event.requests?.length ?? 0,
            status: event.status,
          },
        );
      }

      const message =
        newEventsOnly.length === 1
          ? `New webhook event received: ${
              newEventsOnly[0]?.source || 'Unknown'
            }`
          : `${newEventsOnly.length} new webhook events received`;
      vscode.window.showInformationMessage(message);
    }

    // Check for status changes in existing events
    for (const event of newEvents) {
      const previousEvent = previousEventMap[event.id];
      if (previousEvent && previousEvent.status !== event.status) {
        // Track status change
        this.analyticsService?.trackWebhookEvent(
          event.source,
          'webhook_status_changed',
          {
            event_id: event.id,
            new_status: event.status,
            old_status: previousEvent.status,
          },
        );

        vscode.window.showInformationMessage(
          `Event ${event.id} status changed from ${previousEvent.status} to ${event.status}`,
        );
      }

      // Check for new requests in existing events
      if (previousEvent && event.requests && previousEvent.requests) {
        const previousRequestIds = previousEvent.requests.map((r) => r.id);
        const newRequests = event.requests.filter(
          (r) => previousRequestIds.indexOf(r.id) === -1,
        );
        if (newRequests.length > 0) {
          const message =
            newRequests.length === 1
              ? `New request for event ${event.id}: ${
                  newRequests[0]?.status || 'Unknown'
                }`
              : `${newRequests.length} new requests for event ${event.id}`;
          vscode.window.showInformationMessage(message);
        }

        // Check for request status changes
        const previousRequestMap: Record<
          string,
          EventTypeWithRequest['requests'][0]
        > = {};
        for (const request of previousEvent.requests) {
          previousRequestMap[request.id] = request;
        }
        for (const request of event.requests) {
          const previousRequest = previousRequestMap[request.id];
          if (previousRequest && previousRequest.status !== request.status) {
            vscode.window.showInformationMessage(
              `Request ${request.id} status changed from ${previousRequest.status} to ${request.status}`,
            );
          }
        }
      }
    }
  }

  private handlePolling() {
    // Stop any existing polling
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.authStore?.isSignedIn) {
      // Get polling interval from settings
      const settings = SettingsService.getInstance().getSettings();
      const pollIntervalMs =
        settings.events.pollIntervalMs ?? this.POLL_INTERVAL_MS;

      log(`Starting event polling with interval: ${pollIntervalMs}ms`);

      // Immediately fetch events, then start polling
      this.fetchAndUpdateEvents();
      this.pollInterval = setInterval(() => {
        this.fetchAndUpdateEvents();
      }, pollIntervalMs);
    }
  }

  public async getConfig(): Promise<WebhookConfig | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspaceFolder = workspaceFolders?.[0]?.uri.fsPath;
    const settings = SettingsService.getInstance().getSettings();
    const configFilePath = settings.configFilePath;
    log('Getting config', {
      cachedConfigPath: this.configPath,
      configFilePath,
      workspaceFolder,
      workspaceFolders: workspaceFolders?.map((f) => f.name),
      workspaceFoldersCount: workspaceFolders?.length || 0,
    });

    // Return cached config if available
    if (this.config) {
      log('Returning cached config');
      return this.config;
    }

    let configPath: string | null = null;

    // First check if we have a cached config path
    if (this.configPath && existsSync(this.configPath)) {
      configPath = this.configPath;
      log('Using cached config path', { configPath });
    } else if (configFilePath && configFilePath.trim() !== '') {
      configPath = configFilePath;
      log('Using config path from settings', { configPath });
    } else {
      log('No config path in settings, searching for config file');
      if (!workspaceFolder) {
        log('No workspace folder found, cannot search for config');
        return null;
      }

      // Try to find config in the first workspace folder
      configPath = await findUpConfig({ cwd: workspaceFolder });
      log('Found config path via findUpConfig', {
        configPath,
        workspaceFolder,
      });

      // If not found in first folder, try all workspace folders
      if (!configPath && workspaceFolders && workspaceFolders.length > 1) {
        log(
          'Config not found in first folder, searching all workspace folders',
        );
        for (const folder of workspaceFolders) {
          const foundPath = await findUpConfig({ cwd: folder.uri.fsPath });
          if (foundPath) {
            configPath = foundPath;
            log('Found config in workspace folder', {
              configPath,
              folderName: folder.name,
            });
            break;
          }
        }
      }

      // If still not found, try direct file check in workspace root
      if (!configPath && workspaceFolder) {
        log('Trying direct file check in workspace root');
        const possibleConfigFiles = [
          'unhook.yml',
          'unhook.yaml',
          'unhook.json',
          'unhook.config.yml',
          'unhook.config.yaml',
          'unhook.config.json',
        ];

        for (const configFile of possibleConfigFiles) {
          const fullPath = join(workspaceFolder, configFile);
          if (existsSync(fullPath)) {
            configPath = fullPath;
            log('Found config file via direct check', { configPath });
            break;
          }
        }
      }
    }

    if (!configPath) {
      log('No config path found');
      return null;
    }

    // Cache the config path for future use
    this.configPath = configPath;
    log('Cached config path', { configPath });

    // Set up file watcher if not already set
    this.setupConfigWatcher(configPath);
    log('Loading config from path', { configPath });
    this.config = await loadConfig(configPath);
    log('Config loaded successfully', { webhookId: this.config.webhookId });

    // Update config provider if available
    if (this.configProvider && this.configPath) {
      this.configProvider.setConfig(this.config, this.configPath);
    }

    return this.config;
  }

  private setupConfigWatcher(configPath: string) {
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }
    if (!configPath) return;
    this.configWatcher = vscode.workspace.createFileSystemWatcher(configPath);
    this.configWatcher.onDidChange(() => this.onConfigFileChanged());
    this.configWatcher.onDidCreate(() => this.onConfigFileChanged());
    this.configWatcher.onDidDelete(() => this.onConfigFileChanged());
  }

  private onConfigFileChanged() {
    log('Config file changed, reloading config and events');
    this.config = null;
    this.configPath = null; // Clear cached config path
    // Clear the config watcher so it gets recreated with the new path
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }

    // Clear config provider
    if (this.configProvider) {
      this.configProvider.setConfig(null, '');
    }

    // Only call handlePolling which will handle the initial fetch
    this.handlePolling();
  }

  private async fetchAndUpdateEvents() {
    if (!this.authStore || !this.authStore.isSignedIn) return;

    // Prevent multiple simultaneous calls
    if (this.isFetching) {
      log('Already fetching events, skipping');
      return;
    }

    this.isFetching = true;
    try {
      // Get config and webhookId
      const config = await this.getConfig();
      const webhookId = config?.webhookId;
      if (!webhookId) {
        log('No webhookId found in config');
        return;
      }
      // Fetch events from the API (assuming events.all is the endpoint)
      const events = await this.authStore.api.events.byWebhookId.query({
        webhookId,
      });
      this.updateEvents(events);
      // Only notify authorization service if we were previously unauthorized
      const authState = this.authorizationService.getState();
      if (authState.isUnauthorized) {
        const now = Date.now();
        if (
          now - this.lastAuthorizationSuccessTime >
          this.AUTHORIZATION_SUCCESS_DEBOUNCE_MS
        ) {
          log(
            'Authorization state was unauthorized, calling handleAuthorizationSuccess',
          );
          this.authorizationService.handleAuthorizationSuccess();
          this.lastAuthorizationSuccessTime = now;
        } else {
          log(
            'Authorization success called too recently, skipping to prevent spam',
          );
        }
      } else {
        log(
          'Authorization state is already authorized, skipping handleAuthorizationSuccess',
        );
      }
    } catch (error) {
      log('Failed to fetch events', { error });
      // Check if it's an authorization error
      if (
        error instanceof Error &&
        (error.message.indexOf('UNAUTHORIZED') !== -1 ||
          error.message.indexOf('FORBIDDEN') !== -1 ||
          error.message.indexOf('do not have access') !== -1 ||
          error.message.indexOf('not authorized') !== -1)
      ) {
        const config = await this.getConfig();
        if (config?.webhookId && this.authStore) {
          await this.authorizationService.handleAuthorizationError(
            config.webhookId,
            this.authStore,
          );
        }
      }
    } finally {
      this.isFetching = false;
    }
  }

  async getRequestDetails(requestId: string) {
    const events = await this.getChildren();
    for (const event of events) {
      if ('event' in event) {
        const requests = await this.getChildren(event);
        for (const r of requests) {
          if ('request' in r && r.request.id === requestId) {
            return r.request;
          }
        }
      }
    }
    throw new Error(`Request ${requestId} not found`);
  }

  private async handleNewEventsDelivery(newEvents: EventTypeWithRequest[]) {
    const authStore = this.authStore;
    if (!authStore || !authStore.isSignedIn) return;

    const config = await this.getConfig();
    if (!config) {
      log('No config found, skipping automatic delivery');
      return;
    }

    const previousEventIds = this.previousEvents.map((e) => e.id);
    const newPendingEvents = newEvents.filter(
      (event) =>
        previousEventIds.indexOf(event.id) === -1 && event.status === 'pending',
    );

    if (newPendingEvents.length === 0) return;

    log(
      `Processing ${newPendingEvents.length} new pending events for delivery`,
    );

    for (const event of newPendingEvents) {
      try {
        log(`Delivering event ${event.id}`);

        // Create requests for all destinations
        await createRequestsForEventToAllDestinations({
          api: authStore.api,
          delivery: config.delivery,
          destination: config.destination,
          event,
          isEventRetry: false,
          onRequestCreated: async (request) => {
            log(`Created request ${request.id} for event ${event.id}`);

            // Handle the pending request immediately
            await handlePendingRequest({
              api: authStore.api,
              delivery: config.delivery,
              destination: config.destination,
              request,
              requestFn: async (url, options) => {
                const response = await fetch(url, options);
                const responseText = await response.text();
                return {
                  body: { text: () => Promise.resolve(responseText) },
                  headers: Object.fromEntries(response.headers.entries()),
                  statusCode: response.status,
                };
              },
            });

            log(`Delivered request ${request.id} for event ${event.id}`);
          },
          pingEnabledFn: (destination) => !!destination.ping,
        });

        // Update event status
        if (this.authStore) {
          await this.authStore.api.events.updateEventStatus.mutate({
            eventId: event.id,
            status: 'completed',
          });
        }

        // Track successful delivery
        this.analyticsService?.trackWebhookEvent(
          event.source,
          'webhook_delivered',
          {
            auto_delivery: true,
            destination_count: config.destination?.length ?? 0,
            event_id: event.id,
          },
        );

        log(`Successfully delivered event ${event.id}`);
      } catch (error) {
        log(`Failed to deliver event ${event.id}:`, error);

        // Track delivery failure
        this.analyticsService?.trackWebhookEvent(
          event.source,
          'webhook_delivery_failed',
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            event_id: event.id,
            max_retries: event.maxRetries,
            retry_count: event.retryCount,
          },
        );

        // Update event status to failed if max retries reached
        if (event.retryCount >= event.maxRetries && this.authStore) {
          await this.authStore.api.events.updateEventStatus.mutate({
            eventId: event.id,
            failedReason:
              error instanceof Error ? error.message : 'Delivery failed',
            status: 'failed',
          });
        }
      }
    }

    // Refresh events after processing, but don't trigger authorization success
    // since this is just a refresh after delivery
    if (!this.authStore || !this.authStore.isSignedIn) return;

    // Prevent multiple simultaneous calls
    if (this.isFetching) {
      log('Already fetching events, skipping refresh after delivery');
      return;
    }

    this.isFetching = true;
    try {
      const config = await this.getConfig();
      const webhookId = config?.webhookId;
      if (!webhookId) {
        log('No webhookId found in config');
        return;
      }
      const events = await this.authStore.api.events.byWebhookId.query({
        webhookId,
      });
      this.updateEvents(events);
      // Don't call handleAuthorizationSuccess here as this is just a refresh
    } catch (error) {
      log('Failed to refresh events after delivery', { error });
    } finally {
      this.isFetching = false;
    }
  }
}
