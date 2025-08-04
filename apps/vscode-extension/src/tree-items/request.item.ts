import { extractBody } from '@unhook/client/utils/extract-body';
import type { EventType, RequestType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { formatDistance } from 'date-fns';
import * as vscode from 'vscode';
import { getStatusIconPath } from '../utils/status-icon.utils';
import type { EventItem } from './event.item';

const log = debug('unhook:vscode:request-item');

export function formatRequestDetails({
  request,
  event,
}: {
  request: RequestType;
  event: EventType;
}): string {
  const lines: string[] = [];
  const originRequest = event?.originRequest;

  // Request Details
  lines.push('# Request Details');
  lines.push(`Method: ${originRequest?.method || 'N/A'}`);
  lines.push(`URL: ${originRequest?.sourceUrl || 'N/A'}`);
  lines.push(`Content Type: ${originRequest?.contentType || 'N/A'}`);
  lines.push(`Size: ${originRequest?.size || 0} bytes`);
  lines.push(`Client IP: ${originRequest?.clientIp || 'N/A'}`);
  lines.push('');

  // Headers
  if (originRequest?.headers) {
    lines.push('# Request Headers');
    for (const [key, value] of Object.entries(originRequest.headers)) {
      lines.push(`${key}: ${value}`);
    }
    lines.push('');
  }

  // Request Body
  if (originRequest?.body) {
    lines.push('# Request Body');
    lines.push('```json');
    lines.push(extractBody(originRequest.body) ?? '');
    lines.push('```');
    lines.push('');
  }

  // Response Details
  if (request.response) {
    lines.push('# Response Details');
    lines.push(`Status: ${request.response.status || 'N/A'}`);
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
    super(
      request.destination?.name || 'Unknown',
      vscode.TreeItemCollapsibleState.None,
    );
    this.description = formatDistance(request.timestamp, new Date(), {
      addSuffix: true,
    });
    this.iconPath = getStatusIconPath({ context, request });
    this.contextValue = 'unhook.request';
    this.resourceUri = vscode.Uri.parse('unhook://request');
    this.tooltip = new vscode.MarkdownString(
      `**${request.destination?.name || 'Unknown'}**\n${request.destination?.url || 'N/A'}\n\nStatus: ${request.status}\n\nTime: ${formatDistance(request.timestamp, new Date(), { addSuffix: true })}`,
    );
    this.tooltip.isTrusted = true;
    this.tooltip.supportHtml = true;

    const command = {
      arguments: [this],
      command: 'unhook.viewRequest',
      title: 'View Request Details',
    };
    log('Setting up command for request', {
      hasRequest: !!this.request,
      itemConstructor: this.constructor.name,
      requestId: request.id,
    });
    this.command = command;
  }
}
