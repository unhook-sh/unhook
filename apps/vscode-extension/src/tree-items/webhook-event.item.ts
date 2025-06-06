import * as vscode from 'vscode';
import type { EventTypeWithRequest } from '../types';
import { getStatusIconPath } from '../utils/status-icon.utils';

export class WebhookEventItem extends vscode.TreeItem {
  constructor(
    public event: EventTypeWithRequest,
    context: vscode.ExtensionContext,
  ) {
    // Get the event name from the origin request source URL
    const sourceUrl = new URL(event.originRequest.sourceUrl);
    const eventName = sourceUrl.pathname.split('/').pop() || 'Unknown Event';

    super(
      `${eventName} (${event.source})`,
      vscode.TreeItemCollapsibleState.Expanded,
    );
    this.description = `${event.status} - ${event.timestamp.toLocaleString()}`;
    this.iconPath = getStatusIconPath(
      event.status === 'completed'
        ? 200
        : event.status === 'failed'
          ? 404
          : event.status === 'processing'
            ? 102
            : undefined,
      context,
    );
    this.contextValue = 'webhookEvent';
    this.resourceUri = vscode.Uri.parse('unhook://webhook-event');
    this.tooltip = new vscode.MarkdownString('Webhook Event');
    this.tooltip.isTrusted = true;
    this.tooltip.supportHtml = true;
    this.tooltip.appendMarkdown(
      '\n\n$(eye) View Details\n$(play) Replay Event',
    );
  }
}
