import type { WebhookConfig } from '@unhook/client/config';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { isDeliveryEnabled } from '../commands/delivery.commands';
import type { AnalyticsService } from '../services/analytics.service';
import type { AuthStore } from '../services/auth.service';
import {
  type RealtimeEvent,
  RealtimeService,
} from '../services/realtime.service';
import { SettingsService } from '../services/settings.service';
import { WebhookAuthorizationService } from '../services/webhook-authorization.service';
import { EventItem } from '../tree-items/event.item';
import { RequestItem } from '../tree-items/request.item';
import type { ConfigProvider } from './config.provider';
import {
  filterEvents,
  filterValidEvents,
  filterValidRequests,
  sortEventsAndRequests,
} from './events.utils';
import { EventsConfigManager } from './events-config.manager';
import { EventsDeliveryService } from './events-delivery.service';
import { EventsNotificationService } from './events-notification.service';
import {
  handleEventChange,
  handleRequestChange,
} from './events-realtime.handlers';

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
  private realtimeService: RealtimeService | null = null;
  private authorizationService: WebhookAuthorizationService;
  private analyticsService: AnalyticsService | null = null;
  private isFetching = false;
  private lastAuthorizationSuccessTime = 0;
  private readonly AUTHORIZATION_SUCCESS_DEBOUNCE_MS = 1000; // 1 second debounce
  configProvider: ConfigProvider | null = null;
  private onRealtimeStateChange: (() => void) | null = null;

  // Services
  private configManager: EventsConfigManager;
  private deliveryService: EventsDeliveryService;
  private notificationService: EventsNotificationService;

  constructor(private context: vscode.ExtensionContext) {
    log('Initializing EventsProvider');
    this.authorizationService = WebhookAuthorizationService.getInstance();

    // Initialize services
    this.configManager = new EventsConfigManager(() => {
      this.handleRealtimeConnection();
    });
    this.deliveryService = new EventsDeliveryService(null, null);
    this.notificationService = new EventsNotificationService(null);
  }

  public setAnalyticsService(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
    this.deliveryService = new EventsDeliveryService(
      this.authStore,
      analyticsService,
    );
    this.notificationService = new EventsNotificationService(analyticsService);
  }

  public setAuthStore(authStore: AuthStore) {
    this.authStore = authStore;
    this.deliveryService = new EventsDeliveryService(
      authStore,
      this.analyticsService,
    );
    this.authStore.onDidChangeAuth(() => {
      this.refresh();
      this.handleRealtimeConnection();
    });
    this.refresh();
    this.handleRealtimeConnection();
  }

  public setConfigProvider(configProvider: ConfigProvider) {
    this.configProvider = configProvider;
    this.configManager.setConfigProvider(configProvider);
  }

  public getRealtimeService(): RealtimeService | null {
    return this.realtimeService;
  }

  public setOnRealtimeStateChange(callback: () => void) {
    this.onRealtimeStateChange = callback;
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
      // Filter out invalid requests to prevent tree rendering errors
      const validRequests = filterValidRequests(requests);
      return validRequests.map(
        (request) => new RequestItem(request, element, this.context),
      );
    }

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
    const filteredEvents = filterEvents(this.events, this.filterText);

    // Filter out invalid events to prevent tree rendering errors
    const validEvents = filterValidEvents(filteredEvents);

    return validEvents.map((event) => new EventItem(event, this.context));
  }

  public refresh(): void {
    log('Refreshing tree data');
    this._onDidChangeTreeData.fire(undefined);
  }

  public forceRefresh(): void {
    log('Forcing immediate tree refresh');
    // Fire the event multiple times to ensure the tree view updates
    this._onDidChangeTreeData.fire(undefined);
    // Add a small delay and fire again to ensure the update is processed
    setTimeout(() => {
      this._onDidChangeTreeData.fire(undefined);
    }, 50);
  }

  public refreshAndFetchEvents(): void {
    log('Refreshing and fetching events');

    // Force the config manager to reload configuration
    this.configManager.forceReload();

    // Force a refresh immediately to update the tree view
    this.forceRefresh();

    // Add a small delay to prevent rapid successive calls, then fetch fresh data
    setTimeout(() => {
      this.fetchAndUpdateEvents();
    }, 100);
  }

  public updateEvents(events: EventTypeWithRequest[]): void {
    // Check if notifications are enabled
    const settings = SettingsService.getInstance().getSettings();
    if (settings.notifications.showForNewEvents) {
      this.notificationService.checkForNewEventsAndNotify(
        events,
        this.previousEvents,
      );
    }

    // Handle automatic delivery for new events
    if (isDeliveryEnabled() && this.previousEvents.length > 0) {
      this.configManager.getConfig().then((config) => {
        if (config) {
          this.deliveryService.handleNewEventsDelivery(
            events,
            this.previousEvents,
            config,
          );
        }
      });
    }

    // Store previous events for comparison
    this.previousEvents = [...this.events];

    // Sort events and their requests by timestamp time
    this.events = sortEventsAndRequests(events);

    log('Events updated, refreshing tree view');
    this.refresh();
  }

  public dispose() {
    // Stop realtime service
    if (this.realtimeService) {
      this.realtimeService.dispose();
      this.realtimeService = null;
    }

    // Dispose config manager
    this.configManager.dispose();
  }

  private async handleRealtimeConnection() {
    // Stop any existing realtime connection
    if (this.realtimeService) {
      this.realtimeService.disconnect();
      this.realtimeService = null;
    }

    if (this.authStore?.isSignedIn) {
      log('Starting realtime connection for events');

      // Create realtime service
      this.realtimeService = new RealtimeService({
        authStore: this.authStore,
        onChannelStateChange: (channelType, connected) => {
          log('Realtime channel state changed', { channelType, connected });
          // Notify dev info service of state change
          if (this.onRealtimeStateChange) {
            this.onRealtimeStateChange();
          }
        },
        onConnectionStateChange: (connected) => {
          log('Realtime connection state changed', { connected });
        },
        onEventReceived: this.handleRealtimeEvent.bind(this),
      });

      // Get config and connect to webhook
      const config = await this.configManager.getConfig();
      const webhookId = config?.webhookId;
      if (webhookId) {
        await this.realtimeService.connect(webhookId);
      }

      // Immediately fetch events to get current state
      this.fetchAndUpdateEvents();
    }
  }

  private handleRealtimeEvent(event: RealtimeEvent) {
    log('Handling realtime event', {
      recordId: event.record?.id,
      table: event.table,
      type: event.type,
    });

    // Handle the event based on its type and table
    if (event.table === 'events') {
      handleEventChange(event, {
        events: this.events,
        onEventsUpdate: (events) => {
          this.events = events;
          this.updateEvents(events);
        },
        onRealtimeEventDelivery: async (newEvent) => {
          if (isDeliveryEnabled()) {
            const config = await this.configManager.getConfig();
            if (config) {
              await this.deliveryService.handleRealtimeEventDelivery(
                newEvent,
                config,
              );
            }
          }
        },
        onRefreshAndFetch: () => this.refreshAndFetchEvents(),
      });
    } else if (event.table === 'requests') {
      handleRequestChange(event, {
        events: this.events,
        onEventsUpdate: (events) => {
          this.events = events;
          this.updateEvents(events);
        },
        onRefreshAndFetch: () => this.refreshAndFetchEvents(),
      });
    }
  }

  public async getConfig(): Promise<WebhookConfig | null> {
    return this.configManager.getConfig();
  }

  private async fetchAndUpdateEvents() {
    if (!this.authStore || !this.authStore.isSignedIn) return;

    // Prevent multiple simultaneous calls
    if (this.isFetching) {
      return;
    }

    this.isFetching = true;
    try {
      log('Fetching and updating events - getting config');
      // Get config and webhookId
      const config = await this.getConfig();
      log('Config retrieved', {
        hasConfig: !!config,
        webhookId: config?.webhookId,
      });
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
          this.authorizationService.handleAuthorizationSuccess();
          this.lastAuthorizationSuccessTime = now;
        }
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
}
