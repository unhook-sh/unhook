import type { WebhookConfig } from '@unhook/client/config';
import type { EventTypeWithRequest, RequestType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { isDeliveryEnabled } from '../commands/delivery.commands';
import type { AnalyticsService } from '../services/analytics.service';
import type { AuthStore } from '../services/auth.service';
import { EventsDeliveryService } from '../services/events-delivery.service';
import { EventsNotificationService } from '../services/events-notification.service';
import { PollingService } from '../services/polling.service';

import { SettingsService } from '../services/settings.service';
import { WebhookAuthorizationService } from '../services/webhook-authorization.service';
import { EventItem } from '../tree-items/event.item';
import { LoadingItem } from '../tree-items/loading.item';
import { RequestItem } from '../tree-items/request.item';
import type { ConfigProvider } from './config.provider';
import {
  filterEvents,
  filterValidEvents,
  filterValidRequests,
  sortEventsAndRequests,
} from './events.utils';
import { EventsConfigManager } from './events-config.manager';

const log = debug('unhook:vscode:events-provider');

export class EventsProvider
  implements vscode.TreeDataProvider<EventItem | RequestItem | LoadingItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    EventItem | RequestItem | LoadingItem | undefined
  > = new vscode.EventEmitter<
    EventItem | RequestItem | LoadingItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<
    EventItem | RequestItem | LoadingItem | undefined
  > = this._onDidChangeTreeData.event;

  private filterText = '';
  private events: EventTypeWithRequest[] = [];
  previousEvents: EventTypeWithRequest[] = [];
  public authStore: AuthStore | null = null;
  private pollingService: PollingService | null = null;
  private authorizationService: WebhookAuthorizationService;
  private analyticsService: AnalyticsService | null = null;
  private isFetching = false;
  private hasLoadedEvents = false; // Track if events have been loaded
  configProvider: ConfigProvider | null = null;
  private onPollingStateChange: (() => void) | null = null;
  private onLoadingStateChange: ((isLoading: boolean) => void) | null = null;

  // Services
  private configManager: EventsConfigManager;
  public deliveryService: EventsDeliveryService;
  private notificationService: EventsNotificationService;
  private disposables: vscode.Disposable[] = [];

  constructor(private context: vscode.ExtensionContext) {
    log('Initializing EventsProvider');
    this.authorizationService = WebhookAuthorizationService.getInstance();

    // Initialize services
    this.configManager = new EventsConfigManager();

    // Listen for config changes and handle polling connection
    const configChangeDisposable = this.configManager.onDidChangeConfig(() => {
      log('Config changed, handling polling connection and refreshing events');
      this.handlePollingConnection();
      // Refresh the tree view without forcing a config reload (config already changed)
      this.refreshEventsOnly();
    });
    this.disposables.push(configChangeDisposable);
    this.deliveryService = new EventsDeliveryService(null, null);
    this.notificationService = new EventsNotificationService(null);

    // Set up optimistic update callbacks for delivery service
    this.deliveryService.setOnRequestCreated(
      (eventId: string, request: RequestType) => {
        this.handleOptimisticRequestCreated(eventId, request);
      },
    );
    this.deliveryService.setOnRequestStatusUpdated(
      (
        eventId: string,
        requestId: string,
        status: string,
        responseTimeMs?: number,
      ) => {
        this.handleOptimisticRequestStatusUpdate(
          eventId,
          requestId,
          status,
          responseTimeMs,
        );
      },
    );
  }

  public setAnalyticsService(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
    this.deliveryService = new EventsDeliveryService(
      this.authStore,
      analyticsService,
    );
    // Re-set the optimistic update callbacks
    this.deliveryService.setOnRequestCreated(
      (eventId: string, request: RequestType) => {
        this.handleOptimisticRequestCreated(eventId, request);
      },
    );
    this.deliveryService.setOnRequestStatusUpdated(
      (
        eventId: string,
        requestId: string,
        status: string,
        responseTimeMs?: number,
      ) => {
        this.handleOptimisticRequestStatusUpdate(
          eventId,
          requestId,
          status,
          responseTimeMs,
        );
      },
    );
    this.notificationService = new EventsNotificationService(analyticsService);
  }

  public getAnalyticsService(): AnalyticsService | null {
    return this.analyticsService;
  }

  public setAuthStore(authStore: AuthStore) {
    this.authStore = authStore;
    this.deliveryService = new EventsDeliveryService(
      authStore,
      this.analyticsService,
    );
    // Re-set the optimistic update callbacks
    this.deliveryService.setOnRequestCreated(
      (eventId: string, request: RequestType) => {
        this.handleOptimisticRequestCreated(eventId, request);
      },
    );
    this.deliveryService.setOnRequestStatusUpdated(
      (
        eventId: string,
        requestId: string,
        status: string,
        responseTimeMs?: number,
      ) => {
        this.handleOptimisticRequestStatusUpdate(
          eventId,
          requestId,
          status,
          responseTimeMs,
        );
      },
    );
    this.authStore.onDidChangeAuth(() => {
      // Clear cached events when authentication changes to prevent showing other orgs' events
      // This handles cases like: sign out, sign in with different account, token changes, etc.
      this.clearCachedEvents();
      this.refresh();
      this.handlePollingConnection();
    });
    this.refresh();
    this.handlePollingConnection();
  }

  /**
   * Clears all cached events and resets loading state
   * This ensures users can't see events from other organizations after switching accounts
   *
   * Called automatically when:
   * - User signs out
   * - User signs in with a different account
   * - Authentication state changes (token validation, session changes, etc.)
   */
  private clearCachedEvents(): void {
    log('Clearing cached events due to authentication change');
    this.events = [];
    this.previousEvents = [];
    this.hasLoadedEvents = false;
    this.isFetching = false;
  }

  /**
   * Public method to clear cached events
   * Useful for manual clearing or when called from other services
   */
  public clearEvents(): void {
    log('Manually clearing cached events');
    this.clearCachedEvents();
    this.refresh();
  }

  public setConfigProvider(configProvider: ConfigProvider) {
    this.configProvider = configProvider;
    this.configManager.setConfigProvider(configProvider);
  }

  public getPollingService(): PollingService | null {
    return this.pollingService;
  }

  public setOnPollingStateChange(callback: () => void) {
    this.onPollingStateChange = callback;
  }

  public setOnLoadingStateChange(callback: (isLoading: boolean) => void) {
    this.onLoadingStateChange = callback;
  }

  public getCurrentFilter(): string {
    return this.filterText;
  }

  public setFilter(filterText: string) {
    log('Setting filter', { filterText });
    this.filterText = filterText.toLowerCase();
    this._onDidChangeTreeData.fire(undefined);
  }

  public getTreeItem(
    element: EventItem | RequestItem | LoadingItem,
  ): vscode.TreeItem {
    // For EventItem, dynamically update the collapsible state based on current requests
    if (element instanceof EventItem) {
      const hasRequests =
        element.event.requests && element.event.requests.length > 0;
      element.collapsibleState = hasRequests
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None;
    }
    return element;
  }

  public async getChildren(
    element?: EventItem | RequestItem,
  ): Promise<(EventItem | RequestItem | LoadingItem)[]> {
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

    // Lazy loading: Only fetch events when tree becomes visible and we haven't loaded yet
    if (!this.hasLoadedEvents && !this.isFetching) {
      log('Tree became visible, triggering lazy load of events');
      this.hasLoadedEvents = true; // Mark as loading to prevent multiple calls
      this.fetchAndUpdateEvents();
      return [new LoadingItem(this.context)];
    }

    // Show loading state if we're currently fetching events and have no events yet
    if (this.isFetching && this.events.length === 0) {
      return [new LoadingItem(this.context)];
    }

    // Filter events if needed
    const filteredEvents = filterEvents(this.events, this.filterText);

    // Filter out invalid events to prevent tree rendering errors
    const validEvents = filterValidEvents(filteredEvents);

    return validEvents.map((event) => new EventItem(event, this.context));
  }

  public refresh(): void {
    log('Refreshing tree data - firing onDidChangeTreeData event');
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

    // Set fetching state to show loading
    this.isFetching = true;
    this.hasLoadedEvents = false; // Reset flag to allow fresh loading

    // Notify tree view of loading state change
    if (this.onLoadingStateChange) {
      this.onLoadingStateChange(true);
    }

    // Force a refresh immediately to update the tree view
    this.forceRefresh();

    // Add a small delay to prevent rapid successive calls, then fetch fresh data
    setTimeout(() => {
      this.fetchAndUpdateEvents();
    }, 100);
  }

  public refreshEventsOnly(): void {
    log('Refreshing events only (config already updated)');

    // Set fetching state to show loading
    this.isFetching = true;
    this.hasLoadedEvents = false; // Reset flag to allow fresh loading

    // Notify tree view of loading state change
    if (this.onLoadingStateChange) {
      this.onLoadingStateChange(true);
    }

    // Force a refresh immediately to update the tree view
    this.forceRefresh();

    // Add a small delay to prevent rapid successive calls, then fetch fresh data
    setTimeout(() => {
      this.fetchAndUpdateEvents();
    }, 100);
  }

  public updateEvents(events: EventTypeWithRequest[]): void {
    // Store previous events for comparison BEFORE checking delivery
    const previousEvents = [...this.events];

    // Check if notifications are enabled
    const settings = SettingsService.getInstance().getSettings();
    if (settings.notifications.showForNewEvents) {
      this.notificationService.checkForNewEventsAndNotify(
        events,
        previousEvents,
      );
    }

    // Handle automatic delivery for new events
    const deliveryEnabled = isDeliveryEnabled();
    const hasPreviousEvents = previousEvents.length > 0;

    log('Checking delivery conditions', {
      currentEventsCount: events.length,
      deliveryEnabled,
      hasPreviousEvents,
      previousEventsCount: previousEvents.length,
    });

    if (deliveryEnabled && hasPreviousEvents) {
      log('Delivery conditions met, getting config and handling delivery');
      this.configManager.getConfig().then((config) => {
        if (config) {
          log('Config retrieved, calling handleNewEventsDelivery', {
            configWebhookUrl: config.webhookUrl,
            hasDelivery: !!config.delivery,
          });
          this.deliveryService.handleNewEventsDelivery(
            events,
            previousEvents,
            config,
          );
        } else {
          log('No config available for delivery');
        }
      });
    } else {
      log('Delivery conditions not met', {
        deliveryEnabled,
        hasPreviousEvents,
        reason: !deliveryEnabled ? 'delivery disabled' : 'no previous events',
      });
    }

    // Store previous events for next iteration
    this.previousEvents = [...this.events];

    // Sort events and their requests by timestamp time
    this.events = sortEventsAndRequests(events);

    // Clear loading state since we now have events
    this.isFetching = false;
    this.hasLoadedEvents = true; // Mark that events have been loaded

    // Notify tree view that loading is complete
    if (this.onLoadingStateChange) {
      this.onLoadingStateChange(false);
    }

    log('Events updated, refreshing tree view', {
      eventIds: this.events.map((e) => e.id),
      totalEvents: this.events.length,
    });

    // Force refresh to ensure VSCode processes the tree changes
    this.forceRefresh();
  }

  public dispose() {
    // Stop polling service
    if (this.pollingService) {
      this.pollingService.dispose();
      this.pollingService = null;
    }

    // Dispose config manager
    this.configManager.dispose();

    // Dispose all event listeners
    this.disposables.forEach((disposable) => {
      disposable.dispose();
    });
    this.disposables = [];
  }

  private async handlePollingConnection() {
    // Stop any existing polling connection
    if (this.pollingService) {
      this.pollingService.dispose();
      this.pollingService = null;
    }

    if (this.authStore?.isSignedIn) {
      log('Starting polling connection for events');

      // Get config and create polling service
      const config = await this.configManager.getConfig();
      const webhookUrl = config?.webhookUrl;

      log('Setting up polling service', {
        configWebhookUrl: config?.webhookUrl,
        hasConfig: !!config,
        webhookUrl: webhookUrl,
      });

      if (webhookUrl) {
        // Create polling service
        this.pollingService = new PollingService({
          authStore: this.authStore,
          onError: (error) => {
            log('Polling error', { error: error.message });
          },
          onStateChange: (state) => {
            log('Polling state changed', {
              isPaused: state.isPaused,
              isPolling: state.isPolling,
              webhookUrl: webhookUrl,
            });
            // Notify dev info service of state change
            if (this.onPollingStateChange) {
              this.onPollingStateChange();
            }
          },
        });

        // Subscribe to events received
        const eventSubscription = this.pollingService.onEventsReceived(
          this.handlePollingEvents.bind(this),
        );
        this.disposables.push(eventSubscription);

        // Start polling for the webhook
        this.pollingService.startPolling(webhookUrl);
      }

      // Events will be fetched when tree view becomes visible (lazy loading)
    }
  }

  private handlePollingEvents(changedEvents: EventTypeWithRequest[]) {
    log('Handling polling events', {
      changedEventCount: changedEvents.length,
      hasChangedEvents: changedEvents.length > 0,
    });

    if (changedEvents.length === 0) return;

    // The API now returns a smart filtered list of events:
    // - New events (not in our current list)
    // - Existing events that have new requests (with all their requests)

    // Merge with existing events
    const existingEventMap = new Map(
      this.events.map((event) => [event.id, event]),
    );
    const updatedEvents: EventTypeWithRequest[] = [];

    // First, add all existing events, updating them if they were in the changed list
    for (const existingEvent of this.events) {
      const changedEvent = changedEvents.find((e) => e.id === existingEvent.id);
      if (changedEvent) {
        // Event was updated (has new requests or other changes)
        updatedEvents.push(changedEvent);
      } else {
        // Event unchanged
        updatedEvents.push(existingEvent);
      }
    }

    // Then, add any completely new events that weren't in the existing list
    for (const changedEvent of changedEvents) {
      if (!existingEventMap.has(changedEvent.id)) {
        updatedEvents.unshift(changedEvent); // Add new events at the beginning
      }
    }

    // Update events with the merged data
    // Don't set this.events here - let updateEvents handle it properly
    this.updateEvents(updatedEvents);

    // Note: Delivery is now handled by updateEvents() method, which calls
    // handleNewEventsDelivery() for new events. No need for duplicate delivery here.
  }

  /**
   * Handle optimistic request creation - immediately add request to event in UI
   */
  private handleOptimisticRequestCreated(
    eventId: string,
    request: RequestType,
  ): void {
    log('Handling optimistic request created', {
      eventId,
      requestId: request.id,
    });

    // Find the event and add the request optimistically
    const eventIndex = this.events.findIndex((event) => event.id === eventId);
    if (eventIndex !== -1 && this.events[eventIndex]) {
      const updatedEvents = [...this.events];
      const event = updatedEvents[eventIndex];

      if (event) {
        // Add the new request to the beginning of the requests array
        const updatedEvent = {
          ...event,
          requests: [request, ...(event.requests || [])],
        };
        updatedEvents[eventIndex] = updatedEvent;

        // Update the events array and refresh the UI
        this.events = updatedEvents;

        log('Optimistically added request to event', {
          eventId,
          requestId: request.id,
          requestStatus: request.status,
          totalRequests: updatedEvent.requests.length,
        });

        // Force refresh to update the tree immediately
        this.forceRefresh();
      }
    } else {
      log('Event not found for optimistic request update', { eventId });
    }
  }

  /**
   * Handle optimistic request status update - immediately update request status in UI
   */
  private handleOptimisticRequestStatusUpdate(
    eventId: string,
    requestId: string,
    status: string,
    responseTimeMs?: number,
  ): void {
    log('Handling optimistic request status update', {
      eventId,
      requestId,
      responseTimeMs,
      status,
    });

    // Find the event and update the request status
    const eventIndex = this.events.findIndex((event) => event.id === eventId);
    if (eventIndex !== -1 && this.events[eventIndex]) {
      const updatedEvents = [...this.events];
      const event = updatedEvents[eventIndex];

      if (event?.requests) {
        // Find the request and update its status
        const requestIndex = event.requests.findIndex(
          (r) => r.id === requestId,
        );
        const existingRequest = event.requests[requestIndex];
        if (requestIndex !== -1 && existingRequest) {
          const updatedRequests = [...event.requests];
          updatedRequests[requestIndex] = {
            ...existingRequest,
            responseTimeMs: responseTimeMs || existingRequest.responseTimeMs,
            status: status as 'pending' | 'completed' | 'failed',
          };

          const updatedEvent = {
            ...event,
            requests: updatedRequests,
          };
          updatedEvents[eventIndex] = updatedEvent;

          // Update the events array and refresh the UI
          this.events = updatedEvents;

          log('Optimistically updated request status', {
            eventId,
            newStatus: status,
            oldStatus: existingRequest.status,
            requestId,
            responseTimeMs,
            status,
            totalRequests: updatedEvent.requests.length,
          });

          // Force refresh to update the tree immediately
          this.forceRefresh();
        } else {
          log('Request not found for status update', {
            availableRequestIds: event.requests.map((r) => r.id),
            eventId,
            requestId,
          });
        }
      } else {
        log('Event has no requests array', { eventId });
      }
    } else {
      log('Event not found for request status update', {
        availableEventIds: this.events.map((e) => e.id),
        eventId,
      });
    }
  }

  public async getConfig(): Promise<WebhookConfig | null> {
    return this.configManager.getConfig();
  }

  public getConfigManager(): EventsConfigManager {
    return this.configManager;
  }

  private async fetchAndUpdateEvents() {
    if (!this.authStore || !this.authStore.isSignedIn) return;

    // Prevent multiple simultaneous calls
    if (this.isFetching) {
      return;
    }

    this.isFetching = true;
    // Trigger refresh to show loading state
    this.refresh();
    // Notify tree view of loading state change
    if (this.onLoadingStateChange) {
      this.onLoadingStateChange(true);
    }
    try {
      log('Fetching and updating events - getting config');
      // Get config and webhookId
      const config = await this.getConfig();
      log('Config retrieved', {
        configKeys: config ? Object.keys(config) : [],
        configType: typeof config?.webhookUrl,
        hasConfig: !!config,
        webhookUrl: config?.webhookUrl,
      });
      const webhookUrl = config?.webhookUrl;
      if (!webhookUrl) {
        log('No webhookUrl found in config');
        return;
      }
      log('About to fetch events with webhookUrl', { webhookUrl });
      // Fetch events from the API (assuming events.all is the endpoint)
      const events = await this.authStore.api.events.byWebhookUrl.query({
        webhookUrl: webhookUrl,
      });
      this.updateEvents(events);
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
        if (config?.webhookUrl && this.authStore) {
          await this.authorizationService.handleAuthorizationError(
            config.webhookUrl,
            this.authStore,
          );
        }
      }
    } finally {
      this.isFetching = false;
      // Notify tree view that loading is complete (even if it failed)
      if (this.onLoadingStateChange) {
        this.onLoadingStateChange(false);
      }
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
