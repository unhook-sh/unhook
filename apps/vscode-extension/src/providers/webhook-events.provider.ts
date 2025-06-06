import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { mockEvents } from '../data/mock-events';
import type { AuthStore } from '../stores/auth-store';
import { WebhookEventItem } from '../tree-items/webhook-event.item';
import { WebhookRequestItem } from '../tree-items/webhook-request.item';
import type { EventTypeWithRequest } from '../types';

const log = debug('unhook:vscode:webhook-events-provider');

export class WebhookEventsProvider
  implements vscode.TreeDataProvider<WebhookEventItem | WebhookRequestItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    WebhookEventItem | WebhookRequestItem | undefined
  > = new vscode.EventEmitter<
    WebhookEventItem | WebhookRequestItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<
    WebhookEventItem | WebhookRequestItem | undefined
  > = this._onDidChangeTreeData.event;

  private filterText = '';
  private events: EventTypeWithRequest[] = mockEvents;
  private authStore: AuthStore | null = null;

  constructor(private context: vscode.ExtensionContext) {
    log('Initializing WebhookEventsProvider');
  }

  public setAuthStore(authStore: AuthStore) {
    this.authStore = authStore;
    this.authStore.onDidChangeAuth(() => this.refresh());
    this.refresh();
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
    element: WebhookEventItem | WebhookRequestItem,
  ): vscode.TreeItem {
    return element;
  }

  public async getChildren(
    element?: WebhookEventItem | WebhookRequestItem,
  ): Promise<(WebhookEventItem | WebhookRequestItem)[]> {
    if (element instanceof WebhookEventItem) {
      // Return requests for this event
      return element.event.requests.map(
        (request) => new WebhookRequestItem(request, element, this.context),
      );
    }

    if (element instanceof WebhookRequestItem) {
      // No children for requests
      return [];
    }

    // Root level - show auth state or events
    if (!this.authStore) {
      return [
        new WebhookEventItem(
          {
            id: 'auth-loading',
            webhookId: 'auth',
            status: 'pending',
            apiKey: null,
            createdAt: new Date(),
            updatedAt: null,
            userId: 'auth',
            orgId: 'auth',
            timestamp: new Date(),
            originRequest: {
              id: 'auth-loading',
              method: 'GET',
              sourceUrl: 'https://auth.unhook.sh/status',
              headers: {},
              size: 0,
              contentType: 'application/json',
              clientIp: '127.0.0.1',
            },
            source: 'auth',
            retryCount: 0,
            maxRetries: 0,
            failedReason: null,
            requests: [],
          },
          this.context,
        ),
      ];
    }

    if (this.authStore.isValidatingSession) {
      return [
        new WebhookEventItem(
          {
            id: 'auth-validating',
            webhookId: 'auth',
            status: 'processing',
            apiKey: null,
            createdAt: new Date(),
            updatedAt: null,
            userId: 'auth',
            orgId: 'auth',
            timestamp: new Date(),
            originRequest: {
              id: 'auth-validating',
              method: 'GET',
              sourceUrl: 'https://auth.unhook.sh/status',
              headers: {},
              size: 0,
              contentType: 'application/json',
              clientIp: '127.0.0.1',
            },
            source: 'auth',
            retryCount: 0,
            maxRetries: 0,
            failedReason: null,
            requests: [],
          },
          this.context,
        ),
      ];
    }

    if (!this.authStore.isSignedIn) {
      return [
        new WebhookEventItem(
          {
            id: 'auth-required',
            webhookId: 'auth',
            status: 'failed',
            apiKey: null,
            createdAt: new Date(),
            updatedAt: null,
            userId: 'auth',
            orgId: 'auth',
            timestamp: new Date(),
            originRequest: {
              id: 'auth-required',
              method: 'GET',
              sourceUrl: 'https://auth.unhook.sh/status',
              headers: {},
              size: 0,
              contentType: 'application/json',
              clientIp: '127.0.0.1',
            },
            source: 'auth',
            retryCount: 0,
            maxRetries: 0,
            failedReason: 'Authentication required',
            requests: [],
          },
          this.context,
        ),
      ];
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

    return filteredEvents.map(
      (event) => new WebhookEventItem(event, this.context),
    );
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
}
