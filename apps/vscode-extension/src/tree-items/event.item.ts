import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type { EventTypeWithRequest } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { formatDistance } from 'date-fns';
import * as vscode from 'vscode';
import { getStatusIconPath } from '../utils/status-icon.utils';

const log = debug('unhook:vscode:event-item');

export class EventItem extends vscode.TreeItem {
  constructor(
    public event: EventTypeWithRequest,
    context: vscode.ExtensionContext,
  ) {
    // Use the shared extractEventName helper to get the event name from the base64 body
    const eventName =
      (event.originRequest?.body &&
        extractEventName(event.originRequest.body)) ||
      (() => {
        try {
          // Try to extract from source URL first
          const sourceUrl = event.originRequest?.sourceUrl
            ? new URL(event.originRequest.sourceUrl)
            : null;

          if (sourceUrl?.pathname) {
            const pathPart = sourceUrl.pathname.split('/').pop();
            if (pathPart && pathPart !== '') {
              return pathPart;
            }
          }

          return 'Unknown Event';
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
    // Get source display text - show source URL when source is '*'
    const sourceDisplay =
      event.source === '*'
        ? event.originRequest?.sourceUrl || 'Unknown Source'
        : event.source || 'Unknown Source';

    this.description = `${sourceDisplay} • ${formatDistance(event.timestamp, new Date(), { addSuffix: true })}`;
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
    this.contextValue = 'unhook.event';
    this.resourceUri = vscode.Uri.parse('unhook://event');
    this.tooltip = new vscode.MarkdownString('Event');
    this.tooltip.isTrusted = true;
    this.tooltip.supportHtml = true;
    this.tooltip.appendMarkdown(
      '\n\n$(eye) View Details\n$(play) Replay Event',
    );

    // Add command to view event details
    const command = {
      arguments: [this],
      command: 'unhook.viewEvent',
      title: 'View Event Details',
    };
    log('Setting up command for event', {
      eventId: event.id,
      hasEvent: !!this.event,
      itemConstructor: this.constructor.name,
    });
    this.command = command;
  }
}
