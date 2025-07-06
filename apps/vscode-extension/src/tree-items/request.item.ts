import { extractBody } from '@unhook/client/utils/extract-body';
import type { RequestType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { formatDistance } from 'date-fns';
import * as vscode from 'vscode';
import { getStatusIconPath } from '../utils/status-icon.utils';
import type { EventItem } from './event.item';

const log = debug('unhook:vscode:request-item');

export function formatRequestDetails(request: RequestType): string {
  const lines: string[] = [];

  // Request Details
  lines.push('# Request Details');
  lines.push(`Method: ${request.request.method}`);
  lines.push(`URL: ${request.request.sourceUrl}`);
  lines.push(`Content Type: ${request.request.contentType || 'N/A'}`);
  lines.push(`Size: ${request.request.size} bytes`);
  lines.push(`Client IP: ${request.request.clientIp || 'N/A'}`);
  lines.push('');

  // Headers
  if (request.request.headers) {
    lines.push('# Request Headers');
    for (const [key, value] of Object.entries(request.request.headers)) {
      lines.push(`${key}: ${value}`);
    }
    lines.push('');
  }

  // Request Body
  if (request.request.body) {
    lines.push('# Request Body');
    lines.push('```json');
    lines.push(extractBody(request.request.body) ?? '');
    lines.push('```');
    lines.push('');
  }

  // Response Details
  if (request.response) {
    lines.push('# Response Details');
    lines.push(`Status: ${request.response.status}`);
    lines.push(`Response Time: ${request.responseTimeMs}ms`);
    lines.push('');

    // Response Headers
    if (request.response.headers) {
      lines.push('# Response Headers');
      for (const [key, value] of Object.entries(request.response.headers)) {
        lines.push(`${key}: ${value}`);
      }
      lines.push('');
    }

    // Response Body
    if (request.response.body) {
      lines.push('# Response Body');
      lines.push('```json');
      lines.push(extractBody(request.response.body) ?? '');
      lines.push('```');
    }
  }

  return lines.join('\n');
}

export class RequestItem extends vscode.TreeItem {
  constructor(
    public request: RequestType,
    public parent: EventItem,
    context: vscode.ExtensionContext,
  ) {
    super(request.destination.name, vscode.TreeItemCollapsibleState.None);
    this.description = formatDistance(request.timestamp, new Date(), {
      addSuffix: true,
    });
    this.iconPath = getStatusIconPath({ request, context });
    this.contextValue = 'request';
    this.resourceUri = vscode.Uri.parse('unhook://request');
    this.tooltip = new vscode.MarkdownString(
      `**${request.destination.name}**\n${request.destination.url}\n\nStatus: ${request.status}\n\nTime: ${formatDistance(request.timestamp, new Date(), { addSuffix: true })}`,
    );
    this.tooltip.isTrusted = true;
    this.tooltip.supportHtml = true;

    const command = {
      command: 'unhook.viewRequest',
      title: 'View Request Details',
      arguments: [this],
    };
    log('Setting up command for request', {
      requestId: request.id,
      hasRequest: !!this.request,
      itemConstructor: this.constructor.name,
    });
    this.command = command;
  }
}
