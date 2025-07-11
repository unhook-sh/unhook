import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { formatDistance } from 'date-fns';
import * as vscode from 'vscode';
import { getStatusIconPath } from '../utils/status-icon.utils';

export class EventItem extends vscode.TreeItem {
  constructor(
    public event: EventTypeWithRequest,
    context: vscode.ExtensionContext,
  ) {
    // Use the shared extractEventName helper to get the event name from the base64 body
    const eventName =
      extractEventName(event.originRequest.body) ||
      (() => {
        try {
          const sourceUrl = new URL(event.originRequest.sourceUrl);
          return sourceUrl.pathname.split('/').pop() || 'Unknown Event';
        } catch {
          return 'Unknown Event';
        }
      })();

    // Only show as collapsible if there are requests
    const collapsibleState =
      event.requests && event.requests.length > 0
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None;
    super(eventName, collapsibleState);
    this.description = `${event.source} • ${formatDistance(event.timestamp, new Date(), { addSuffix: true })}`;
    const lastRequest = event.requests?.[0];

    // If there are no requests yet, use a default icon based on event status
    if (!lastRequest) {
      this.iconPath = getStatusIconPath({
        context,
        eventStatus: event.status,
        request: null,
      });
    } else {
      this.iconPath = getStatusIconPath({
        context,
        request: lastRequest,
      });
    }
    this.contextValue = 'event';
    this.resourceUri = vscode.Uri.parse('unhook://event');
    this.tooltip = new vscode.MarkdownString('Event');
    this.tooltip.isTrusted = true;
    this.tooltip.supportHtml = true;
    this.tooltip.appendMarkdown(
      '\n\n$(eye) View Details\n$(play) Replay Event',
    );
  }
}
