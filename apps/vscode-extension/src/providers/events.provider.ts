import {
  type WebhookConfig,
  findUpConfig,
  loadConfig,
} from '@unhook/client/config';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import type { AuthStore } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
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
  private authStore: AuthStore | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 10000; // 10 seconds
  private config: WebhookConfig | null = null;
  private configWatcher: vscode.FileSystemWatcher | null = null;

  constructor(private context: vscode.ExtensionContext) {
    log('Initializing EventsProvider');
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
      // Return requests for this event
      return (element.event.requests ?? []).map(
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

  public updateEvents(events: EventTypeWithRequest[]): void {
    log('Updating events', { eventCount: events.length });
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

  private handlePolling() {
    // Stop any existing polling
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.authStore?.isSignedIn) {
      // Immediately fetch events, then start polling
      this.fetchAndUpdateEvents();
      this.pollInterval = setInterval(() => {
        this.fetchAndUpdateEvents();
      }, this.POLL_INTERVAL_MS);
    }
  }

  private async getConfig(): Promise<WebhookConfig | null> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const settings = SettingsService.getInstance().getSettings();
    const configFilePath = settings.configFilePath;
    log('Getting config', { workspaceFolder, configFilePath });
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
    } catch (error) {
      log('Failed to fetch events', { error });
    }
  }

  async getRequestDetails(requestId: string) {
    const events = await this.getChildren();
    for (const event of events) {
      if ('event' in event) {
        const requests = await this.getChildren(event);
        const request = requests.find(
          (r): r is RequestItem => 'request' in r && r.request.id === requestId,
        );
        if (request) {
          return request.request;
        }
      }
    }
    throw new Error(`Request ${requestId} not found`);
  }
}
