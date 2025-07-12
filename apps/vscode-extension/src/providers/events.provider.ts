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
import type { AuthStore } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { WebhookAuthorizationService } from '../services/webhook-authorization.service';
import { EventItem } from '../tree-items/event.item';
import { RequestItem } from '../tree-items/request.item';

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
  private readonly POLL_INTERVAL_MS = 2000; // Changed from 10000 to 2000 for more responsive updates
  private config: WebhookConfig | null = null;
  private configWatcher: vscode.FileSystemWatcher | null = null;
  private authorizationService: WebhookAuthorizationService;

  constructor(private context: vscode.ExtensionContext) {
    log('Initializing EventsProvider');
    this.authorizationService = WebhookAuthorizationService.getInstance();
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
            event.status.toLowerCase().includes(this.filterText),
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
    this.fetchAndUpdateEvents();
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
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const settings = SettingsService.getInstance().getSettings();
    const configFilePath = settings.configFilePath;
    log('Getting config', { configFilePath, workspaceFolder });
    if (this.config) return this.config;
    let configPath: string | null = null;
    if (configFilePath && configFilePath.trim() !== '') {
      configPath = configFilePath;
    } else {
      configPath = await findUpConfig({ cwd: workspaceFolder });
    }
    log('Config path', { configPath });
    if (!configPath) return null;
    // Set up file watcher if not already set
    this.setupConfigWatcher(configPath);
    log('Loading config', { configPath });
    this.config = await loadConfig(configPath);
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
    this.fetchAndUpdateEvents();
    this.handlePolling();
  }

  private async fetchAndUpdateEvents() {
    if (!this.authStore || !this.authStore.isSignedIn) return;
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
      // If we successfully fetched events, notify authorization service
      this.authorizationService.handleAuthorizationSuccess();
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

        log(`Successfully delivered event ${event.id}`);
      } catch (error) {
        log(`Failed to deliver event ${event.id}:`, error);

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

    // Refresh events after processing
    this.fetchAndUpdateEvents();
  }
}
