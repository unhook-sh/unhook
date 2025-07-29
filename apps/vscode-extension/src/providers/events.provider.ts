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
import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type {
  EventTypeWithRequest,
  RequestPayload,
  ResponsePayload,
} from '@unhook/db/schema';
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
  private config: WebhookConfig | null = null;
  private configPath: string | null = null;
  private configWatcher: vscode.FileSystemWatcher | null = null;
  private authorizationService: WebhookAuthorizationService;
  private analyticsService: AnalyticsService | null = null;
  private isFetching = false;
  private lastAuthorizationSuccessTime = 0;
  private readonly AUTHORIZATION_SUCCESS_DEBOUNCE_MS = 1000; // 1 second debounce
  private configProvider: ConfigProvider | null = null;
  private onRealtimeStateChange: (() => void) | null = null;

  constructor(private context: vscode.ExtensionContext) {
    log('Initializing EventsProvider');
    this.authorizationService = WebhookAuthorizationService.getInstance();
  }

  /**
   * Sort events by timestamp time in descending order (newest first)
   */
  private sortEventsByTimestamp(
    events: EventTypeWithRequest[],
  ): EventTypeWithRequest[] {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }

  /**
   * Sort requests by createdAt time in descending order (newest first)
   */
  private sortRequestsByCreatedAt(
    requests: EventTypeWithRequest['requests'],
  ): EventTypeWithRequest['requests'] {
    if (!requests) return [];
    return [...requests].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }

  /**
   * Sort events and their requests by createdAt time
   */
  private sortEventsAndRequests(
    events: EventTypeWithRequest[],
  ): EventTypeWithRequest[] {
    return this.sortEventsByTimestamp(events).map((event) => ({
      ...event,
      requests: this.sortRequestsByCreatedAt(event.requests ?? []),
    }));
  }

  public setAnalyticsService(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
  }

  public setAuthStore(authStore: AuthStore) {
    this.authStore = authStore;
    this.authStore.onDidChangeAuth(() => {
      this.refresh();
      this.handleRealtimeConnection();
    });
    this.refresh();
    this.handleRealtimeConnection();
  }

  public setConfigProvider(configProvider: ConfigProvider) {
    this.configProvider = configProvider;
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
      const validRequests = requests.filter((request) => {
        if (!request || typeof request !== 'object') {
          log('Filtering out invalid request:', request);
          return false;
        }
        if (!request.id || !request.destination) {
          log('Filtering out request with missing required fields:', {
            hasDestination: !!request.destination,
            id: request.id,
          });
          return false;
        }
        return true;
      });
      return validRequests.map(
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

    // Filter out invalid events to prevent tree rendering errors
    const validEvents = filteredEvents.filter((event) => {
      if (!event || typeof event !== 'object') {
        log('Filtering out invalid event:', event);
        return false;
      }
      if (!event.id) {
        log('Filtering out event with missing ID:', event);
        return false;
      }
      return true;
    });

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
      this.checkForNewEventsAndNotify(events);
    }

    // Handle automatic delivery for new events
    if (isDeliveryEnabled() && this.previousEvents.length > 0) {
      this.handleNewEventsDelivery(events);
    }

    // Store previous events for comparison
    this.previousEvents = [...this.events];

    // Sort events and their requests by timestamp time
    this.events = this.sortEventsAndRequests(events);

    log('Events updated, refreshing tree view');
    this.refresh();
  }

  public dispose() {
    // Stop realtime service
    if (this.realtimeService) {
      this.realtimeService.dispose();
      this.realtimeService = null;
    }

    // Dispose config watcher
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
      const eventName = extractEventName(event.originRequest?.body);

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
          `Event ${eventName} status changed from ${previousEvent.status} to ${event.status}`,
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
              ? `New request for event ${eventName}: ${
                  newRequests[0]?.status || 'Unknown'
                }`
              : `${newRequests.length} new requests for event ${eventName}`;
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
              `Request ${eventName} status changed from ${previousRequest.status} to ${request.status}`,
            );
          }
        }
      }
    }
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
      const config = await this.getConfig();
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
      this.handleEventChange(event);
    } else if (event.table === 'requests') {
      this.handleRequestChange(event);
    }
  }

  private handleEventChange(event: RealtimeEvent) {
    const eventId = event.record?.id as string;
    if (!eventId) {
      log('No event ID in realtime event');
      return;
    }

    try {
      if (event.type === 'INSERT') {
        // New event - construct from realtime data
        const newEvent = this.constructEventFromRealtimeData(event.record);
        if (newEvent) {
          // Add the new event and sort by timestamp
          this.events = this.sortEventsByTimestamp([newEvent, ...this.events]);
          log('Added new event from realtime data', { eventId });

          // Handle automatic delivery for new realtime events
          if (isDeliveryEnabled()) {
            this.handleRealtimeEventDelivery(newEvent);
          }
        }
      } else if (event.type === 'UPDATE') {
        // Updated event - update existing event with new data, but preserve originRequest
        const updatedEvent = this.constructEventFromRealtimeData(event.record);
        if (updatedEvent) {
          // Replace the existing event
          const eventIndex = this.events.findIndex((e) => e.id === eventId);
          if (eventIndex !== -1) {
            // Preserve existing originRequest and requests when updating event
            const existingEvent = this.events[eventIndex];
            if (!existingEvent) {
              log('Existing event is undefined, skipping update', { eventId });
              return;
            }
            const existingRequests = existingEvent.requests ?? [];
            this.events[eventIndex] = {
              ...updatedEvent,
              originRequest: existingEvent.originRequest, // Preserve originRequest
              requests: this.sortRequestsByCreatedAt(existingRequests),
            };
            log(
              'Updated existing event from realtime data (preserving originRequest)',
              { eventId },
            );
          } else {
            // Event not found in current list, add it and sort
            this.events = this.sortEventsByTimestamp([
              updatedEvent,
              ...this.events,
            ]);
            log('Added missing event after update', { eventId });
          }
        }
      } else if (event.type === 'DELETE') {
        // Deleted event - remove from the list
        this.events = this.events.filter((e) => e.id !== eventId);
        log('Removed deleted event', { eventId });
      }

      // Update the events and refresh the tree view
      this.updateEvents(this.events);
    } catch (error) {
      log('Failed to handle event change from realtime data', {
        error,
        eventId,
      });
      // Fallback to full refresh if realtime data processing fails
      this.refreshAndFetchEvents();
    }
  }

  private handleRequestChange(event: RealtimeEvent) {
    const requestId = event.record?.id as string;
    const eventId = event.record?.eventId as string;

    if (!requestId || !eventId) {
      log('No request ID or event ID in realtime event');
      return;
    }

    try {
      if (event.type === 'INSERT') {
        // New request - construct from realtime data and add to event
        const newRequest = this.constructRequestFromRealtimeData(event.record);
        if (newRequest) {
          // Find the event and add the new request
          const eventIndex = this.events.findIndex((e) => e.id === eventId);
          if (eventIndex !== -1 && this.events[eventIndex]) {
            this.events[eventIndex].requests = this.sortRequestsByCreatedAt([
              newRequest,
              ...(this.events[eventIndex]?.requests ?? []),
            ]);
            log('Added new request to event from realtime data', {
              eventId,
              requestId,
            });
          } else {
            // Event not found, we need to fetch it or wait for event to arrive
            log(
              'Event not found for new request, will be handled when event arrives',
              { eventId, requestId },
            );
          }
        }
      } else if (event.type === 'UPDATE') {
        // Updated request - update existing request in event
        const updatedRequest = this.constructRequestFromRealtimeData(
          event.record,
        );
        if (updatedRequest) {
          // Find the event and update the request
          const eventIndex = this.events.findIndex((e) => e.id === eventId);
          if (eventIndex !== -1 && this.events[eventIndex]) {
            const requestIndex = this.events[eventIndex]?.requests?.findIndex(
              (r) => r.id === requestId,
            );
            if (
              requestIndex !== -1 &&
              requestIndex !== undefined &&
              this.events[eventIndex].requests
            ) {
              this.events[eventIndex].requests[requestIndex] = updatedRequest;
              log('Updated request in event from realtime data', {
                eventId,
                requestId,
              });
            } else {
              // Request not found, add it and sort
              this.events[eventIndex].requests = this.sortRequestsByCreatedAt([
                updatedRequest,
                ...(this.events[eventIndex]?.requests ?? []),
              ]);
              log('Added missing request after update', { eventId, requestId });
            }
          }
        }
      } else if (event.type === 'DELETE') {
        // Deleted request - remove from event
        const eventIndex = this.events.findIndex((e) => e.id === eventId);
        if (eventIndex !== -1 && this.events[eventIndex]) {
          this.events[eventIndex].requests = (
            this.events[eventIndex]?.requests ?? []
          ).filter((r) => r.id !== requestId);
          log('Removed request from event', { eventId, requestId });
        }
      }

      // Update the events and refresh the tree view
      this.updateEvents(this.events);
    } catch (error) {
      log('Failed to handle request change from realtime data', {
        error,
        eventId,
        requestId,
      });
      // Fallback to full refresh if realtime data processing fails
      this.refreshAndFetchEvents();
    }
  }

  private constructEventFromRealtimeData(
    record: Record<string, unknown>,
  ): EventTypeWithRequest | null {
    try {
      // Log the realtime record to see what we're getting
      log('Constructing event from realtime data', {
        hasOriginRequest: !!record.originRequest,
        originRequestBody: record.originRequest
          ? (record.originRequest as Record<string, unknown>)?.body
          : 'NOT_FOUND',
        originRequestKeys: record.originRequest
          ? Object.keys(record.originRequest as object)
          : [],
        recordId: record.id,
      });

      // Parse the realtime record into an EventTypeWithRequest
      const event: EventTypeWithRequest = {
        apiKeyId: record.apiKeyId as string,
        createdAt: new Date(record.createdAt as string),
        failedReason: record.failedReason as string | null,
        id: record.id as string,
        maxRetries: record.maxRetries as number,
        orgId: record.orgId as string,
        originRequest: record.originRequest as RequestPayload,
        requests: [],
        retryCount: record.retryCount as number,
        source: record.source as string,
        status: record.status as
          | 'pending'
          | 'processing'
          | 'completed'
          | 'failed',
        timestamp: new Date(record.timestamp as string),
        updatedAt: record.updatedAt
          ? new Date(record.updatedAt as string)
          : null,
        userId: record.userId as string,
        webhookId: record.webhookId as string,
      };

      return event;
    } catch (error) {
      log('Failed to construct event from realtime data', { error, record });
      return null;
    }
  }

  private constructRequestFromRealtimeData(
    record: Record<string, unknown>,
  ): EventTypeWithRequest['requests'][0] | null {
    try {
      // Log the realtime record to see what we're getting
      log('Constructing request from realtime data', {
        hasRequest: !!record.request,
        hasResponse: !!record.response,
        recordId: record.id,
        requestBody: record.request
          ? (record.request as Record<string, unknown>)?.body
          : 'NOT_FOUND',
        requestKeys: record.request
          ? Object.keys(record.request as Record<string, unknown>)
          : [],
        responseKeys: record.response
          ? Object.keys(record.response as Record<string, unknown>)
          : [],
      });

      // Parse the realtime record into a request with proper date conversion
      const request: EventTypeWithRequest['requests'][0] = {
        apiKeyId: record.apiKeyId as string,
        completedAt: record.completedAt
          ? new Date(record.completedAt as string)
          : null,
        connectionId: record.connectionId as string | null,
        createdAt: new Date(record.createdAt as string),
        destination: record.destination as { name: string; url: string },
        eventId: record.eventId as string | null,
        failedReason: record.failedReason as string | null,
        id: record.id as string,
        orgId: record.orgId as string,
        request: record.request as RequestPayload,
        response: record.response as ResponsePayload | null,
        responseTimeMs: record.responseTimeMs as number,
        source: record.source as string,
        status: record.status as 'pending' | 'completed' | 'failed',
        timestamp: new Date(record.timestamp as string),
        userId: record.userId as string,
        webhookId: record.webhookId as string,
      };

      return request;
    } catch (error) {
      log('Failed to construct request from realtime data', { error, record });
      return null;
    }
  }

  public async getConfig(): Promise<WebhookConfig | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspaceFolder = workspaceFolders?.[0]?.uri.fsPath;
    const settings = SettingsService.getInstance().getSettings();
    const configFilePath = settings.configFilePath;

    // Return cached config if available
    if (this.config) {
      return this.config;
    }

    let configPath: string | null = null;

    // First check if we have a cached config path
    if (this.configPath && existsSync(this.configPath)) {
      configPath = this.configPath;
    } else if (configFilePath && configFilePath.trim() !== '') {
      configPath = configFilePath;
    } else {
      if (!workspaceFolder) {
        return null;
      }

      // Try to find config in the first workspace folder
      configPath = await findUpConfig({ cwd: workspaceFolder });

      // If not found in first folder, try all workspace folders
      if (!configPath && workspaceFolders && workspaceFolders.length > 1) {
        for (const folder of workspaceFolders) {
          const foundPath = await findUpConfig({ cwd: folder.uri.fsPath });
          if (foundPath) {
            configPath = foundPath;
            break;
          }
        }
      }

      // If still not found, try direct file check in workspace root
      if (!configPath && workspaceFolder) {
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
            break;
          }
        }
      }
    }

    if (!configPath) {
      return null;
    }

    // Cache the config path for future use
    this.configPath = configPath;

    // Set up file watcher if not already set
    this.setupConfigWatcher(configPath);
    this.config = await loadConfig(configPath);
    log('Config loaded successfully', {
      configPath,
      webhookId: this.config.webhookId,
    });

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

    // Only call handleRealtimeConnection which will handle the initial fetch
    this.handleRealtimeConnection();
  }

  private async fetchAndUpdateEvents() {
    if (!this.authStore || !this.authStore.isSignedIn) return;

    // Prevent multiple simultaneous calls
    if (this.isFetching) {
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

  private async handleRealtimeEventDelivery(event: EventTypeWithRequest) {
    const authStore = this.authStore;
    if (!authStore || !authStore.isSignedIn) return;

    const config = await this.getConfig();
    if (!config) {
      return;
    }

    try {
      log(`Delivering realtime event ${event.id}`);

      // Create requests for all destinations
      await createRequestsForEventToAllDestinations({
        api: authStore.api,
        delivery: config.delivery,
        destination: config.destination,
        event,
        isEventRetry: false,
        onRequestCreated: async (request) => {
          log(`Created request ${request.id} for realtime event ${event.id}`);

          // Handle the pending request immediately
          await handlePendingRequest({
            api: authStore.api,
            delivery: config.delivery,
            destination: config.destination,
            request,
            requestFn: async (url, options) => {
              try {
                const response = await fetch(url, options);
                if (!response) {
                  throw new Error('No response received from fetch');
                }
                const responseText = await response.text();
                return {
                  body: { text: () => Promise.resolve(responseText) },
                  headers: Object.fromEntries(response.headers.entries()),
                  statusCode: response.status,
                };
              } catch (error) {
                log('Error in requestFn:', error);
                throw error;
              }
            },
          });

          log(`Delivered request ${request.id} for realtime event ${event.id}`);
        },
        pingEnabledFn: (destination) => !!destination.ping,
      });

      // Track successful delivery
      this.analyticsService?.trackWebhookEvent(
        event.source,
        'webhook_delivered',
        {
          auto_delivery: true,
          destination_count: config.destination?.length ?? 0,
          event_id: event.id,
          realtime: true,
        },
      );

      log(`Successfully delivered realtime event ${event.id}`);
    } catch (error) {
      log(`Failed to deliver realtime event ${event.id}:`, error);

      // Track delivery failure
      this.analyticsService?.trackWebhookEvent(
        event.source,
        'webhook_delivery_failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          event_id: event.id,
          max_retries: event.maxRetries,
          realtime: true,
          retry_count: event.retryCount,
        },
      );
    }
  }

  private async handleNewEventsDelivery(newEvents: EventTypeWithRequest[]) {
    const authStore = this.authStore;
    if (!authStore || !authStore.isSignedIn) return;

    const config = await this.getConfig();
    if (!config) {
      return;
    }

    const previousEventIds = this.previousEvents.map((e) => e.id);
    const newPendingEvents = newEvents.filter(
      (event) =>
        previousEventIds.indexOf(event.id) === -1 && event.status === 'pending',
    );

    if (newPendingEvents.length === 0) return;

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
                try {
                  const response = await fetch(url, options);
                  if (!response) {
                    throw new Error('No response received from fetch');
                  }
                  const responseText = await response.text();
                  return {
                    body: { text: () => Promise.resolve(responseText) },
                    headers: Object.fromEntries(response.headers.entries()),
                    statusCode: response.status,
                  };
                } catch (error) {
                  log('Error in requestFn:', error);
                  throw error;
                }
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
