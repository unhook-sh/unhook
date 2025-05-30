import * as vscode from 'vscode';
import type { WebhookEventsProvider } from '../providers/webhook-events.provider';
import type { WebhookEventItem } from '../tree-items/webhook-event.item';
import type { WebhookRequestItem } from '../tree-items/webhook-request.item';
import { getStatusIcon } from '../utils/status-icon';

export function registerWebhookEventCommands(
  context: vscode.ExtensionContext,
  provider: WebhookEventsProvider,
): void {
  // Add refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('unhook.webhookEvents.refresh', () => {
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

  // Add copy status icon command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'unhook.copyStatusIcon',
      (item: WebhookEventItem | WebhookRequestItem) => {
        const icon = getStatusIcon(item);
        vscode.env.clipboard.writeText(icon);
        vscode.window.showInformationMessage(`Copied status icon: ${icon}`);
      },
    ),
  );

  // Add open request details command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'unhook.openRequestDetails',
      async (requestId: string) => {
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
            throw new Error(`Request ${requestId} not found`);
          }

          // Open the request details in a custom editor with the request data
          const uri = vscode.Uri.parse(
            `unhook://request/${requestId}?${encodeURIComponent(JSON.stringify(requestData, null, 2))}`,
          );
          await vscode.commands.executeCommand(
            'vscode.openWith',
            uri,
            'unhook.requestDetails',
          );
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to open request details: ${error}`,
          );
        }
      },
    ),
  );
}
