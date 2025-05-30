import * as vscode from 'vscode';
import type { EventType } from '../types';
import { getStatusIconPath } from '../utils/status-icon.utils';

export class WebhookEventItem extends vscode.TreeItem {
  constructor(
    public event: EventType,
    context: vscode.ExtensionContext,
  ) {
    super(`Event ${event.id}`, vscode.TreeItemCollapsibleState.Expanded);
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
