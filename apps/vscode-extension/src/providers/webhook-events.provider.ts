import * as vscode from 'vscode';
import { mockEvents } from '../data/mock-events';
import { WebhookEventItem } from '../tree-items/webhook-event.item';
import { WebhookRequestItem } from '../tree-items/webhook-request.item';
import type { EventTypeWithRequest } from '../types';

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

  private events: EventTypeWithRequest[] = mockEvents;

  constructor(private context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: WebhookEventItem | WebhookRequestItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: WebhookEventItem | WebhookRequestItem,
  ): Thenable<(WebhookEventItem | WebhookRequestItem)[]> {
    if (!element) {
      return Promise.resolve(
        this.events.map((e) => new WebhookEventItem(e, this.context)),
      );
    }
    if (element instanceof WebhookEventItem) {
      // Return the requests for this event
      const event = this.events.find((e) => e.id === element.event.id);
      if (event) {
        return Promise.resolve(
          event.requests.map(
            (r) => new WebhookRequestItem(r, element, this.context),
          ),
        );
      }
    }
    return Promise.resolve([]);
  }
}
