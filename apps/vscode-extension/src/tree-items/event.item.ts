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

    super(eventName, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `${event.source} • ${formatDistance(event.timestamp, new Date(), { addSuffix: true })}`;
    const lastRequest = event.requests[0];
    if (!lastRequest) {
      throw new Error('No requests found for event');
    }

    this.iconPath = getStatusIconPath({
      request: lastRequest,
      context,
    });
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
