import * as vscode from 'vscode';
import type { WebhookEventsProvider } from '../providers/webhook-events.provider';
import type { RequestDetailsWebviewProvider } from '../request-details-webview/request-details.webview';
import type { WebhookEventItem } from '../tree-items/webhook-event.item';
import type { WebhookRequestItem } from '../tree-items/webhook-request.item';

import { debug } from '@unhook/logger';

const log = debug('unhook:vscode:webhook-events-commands');

export function registerWebhookEventCommands(
  context: vscode.ExtensionContext,
  provider: WebhookEventsProvider,
  webviewProvider: RequestDetailsWebviewProvider,
): void {
  // Add refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('unhook.webhookEvents.refresh', () => {
      log('Refreshing webhook events');
      provider.refresh();
    }),
  );

  // Add replay command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'unhook.replayEvent',
      async (item: WebhookEventItem) => {
        try {
          // Show a loading message
          vscode.window.showInformationMessage(
            `Replaying event ${item.event.id}...`,
          );

          // TODO: Implement actual replay logic here
          // For now, just simulate a delay
          await new Promise((resolve) => setTimeout(resolve, 1000));

          vscode.window.showInformationMessage(
            `Event ${item.event.id} replayed successfully`,
          );
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to replay event: ${error}`);
        }
      },
    ),
  );

  // Add copy event command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'unhook.copyEvent',
      async (item: WebhookEventItem) => {
        try {
          const eventData = JSON.stringify(item.event, null, 2);
          await vscode.env.clipboard.writeText(eventData);
          vscode.window.showInformationMessage(
            'Event data copied to clipboard',
          );
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to copy event: ${error}`);
        }
      },
    ),
  );

  // Add view event command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'unhook.viewEvent',
      async (item: WebhookEventItem) => {
        try {
          log('Opening event details', { eventId: item.event.id });

          // Set the event data in the webview
          webviewProvider.setRequestData(item.event.originRequest);

          // Focus the webview
          await vscode.commands.executeCommand('unhook.requestDetails.focus');

          log('Event details shown successfully', { eventId: item.event.id });
        } catch (error) {
          log('Failed to open event details', {
            eventId: item.event.id,
            error,
          });
          vscode.window.showErrorMessage(
            `Failed to open event details: ${error}`,
          );
        }
      },
    ),
  );

  // Add view request command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'unhook.viewRequest',
      async (item: WebhookRequestItem) => {
        try {
          log('Opening request details', { requestId: item.request.id });

          // Set the request data in the webview
          webviewProvider.setRequestData(item.request);

          // Focus the webview
          await vscode.commands.executeCommand('unhook.requestDetails.focus');

          log('Request details shown successfully', {
            requestId: item.request.id,
          });
        } catch (error) {
          log('Failed to open request details', {
            requestId: item.request.id,
            error,
          });
          vscode.window.showErrorMessage(
            `Failed to open request details: ${error}`,
          );
        }
      },
    ),
  );

  // Add replay request command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'unhook.replayRequest',
      async (item: WebhookRequestItem) => {
        try {
          // Show a loading message
          vscode.window.showInformationMessage(
            `Replaying request ${item.request.id}...`,
          );

          // TODO: Implement actual replay logic here
          // For now, just simulate a delay
          await new Promise((resolve) => setTimeout(resolve, 1000));

          vscode.window.showInformationMessage(
            `Request ${item.request.id} replayed successfully`,
          );
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to replay request: ${error}`);
        }
      },
    ),
  );

  // Add open request details command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'unhook.openRequestDetails',
      async (requestId: string) => {
        log('Opening request details', { requestId });
        try {
          // Find the request data from the provider
          const events = await provider.getChildren();
          let requestData = null;

          // Search through events and their requests to find the matching request
          for (const event of events) {
            if ('event' in event) {
              // Check if it's a WebhookEventItem
              const requests = await provider.getChildren(event);
              const request = requests.find(
                (r) => 'request' in r && r.request.id === requestId,
              );
              if (request && 'request' in request) {
                requestData = request.request;
                break;
              }
            }
          }

          if (!requestData) {
            log('Request not found', { requestId });
            throw new Error(`Request ${requestId} not found`);
          }

          log('Found request data, showing in webview', { requestId });

          // Set the request data in the webview
          webviewProvider.setRequestData(requestData);

          // Focus the webview
          await vscode.commands.executeCommand('unhook.requestDetails.focus');

          log('Request details shown successfully', { requestId });
        } catch (error) {
          log('Failed to open request details', { requestId, error });
          vscode.window.showErrorMessage(
            `Failed to open request details: ${error}`,
          );
        }
      },
    ),
  );

  // Register filter command
  const filterCommand = vscode.commands.registerCommand(
    'unhook.webhookEvents.filter',
    async () => {
      log('Opening filter input');
      const filterText = await vscode.window.showInputBox({
        prompt: 'Filter webhook events',
        placeHolder: 'Type to filter by ID, type, or status',
        value: provider.getCurrentFilter(),
      });

      if (filterText !== undefined) {
        log('Setting filter', { filterText });
        provider.setFilter(filterText);
      }
    },
  );

  context.subscriptions.push(filterCommand);
}
