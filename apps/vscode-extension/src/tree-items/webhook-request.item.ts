import * as vscode from 'vscode';
import type { RequestType } from '../types';
import { getStatusIconPath } from '../utils/status-icon.utils';
import type { WebhookEventItem } from './webhook-event.item';

export class WebhookRequestItem extends vscode.TreeItem {
  constructor(
    public request: RequestType,
    public parent: WebhookEventItem,
    context: vscode.ExtensionContext,
  ) {
    super(request.destination.name, vscode.TreeItemCollapsibleState.None);
    this.description = `${request.status} - ${request.timestamp.toLocaleString()}`;
    this.iconPath = getStatusIconPath(request.response?.status, context);
    this.command = {
      command: 'unhook.openRequestDetails',
      title: 'View Request Details',
      arguments: [request.id],
    };
    this.contextValue = 'webhookRequest';
    this.resourceUri = vscode.Uri.parse('unhook://webhook-request');
    this.tooltip = new vscode.MarkdownString('Click to view request details');
    this.tooltip.isTrusted = true;
    this.tooltip.supportHtml = true;
    this.tooltip.appendMarkdown('\n\n$(eye) View Details');
  }
}
