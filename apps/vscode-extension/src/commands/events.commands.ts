import {
  createRequestsForEventToAllDestinations,
  handlePendingRequest,
} from '@unhook/client/utils/delivery';
import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { eventsTreeView, requestDetailsWebviewProvider } from '../extension';
import type { EventsProvider } from '../providers/events.provider';
import type { EventItem } from '../tree-items/event.item';
import type { RequestItem } from '../tree-items/request.item';
import { isDeliveryPaused } from './delivery.commands';

const log = debug('unhook:vscode:webhook-events-commands');

let isCollapsed = true;

export function registerEventCommands(
  context: vscode.ExtensionContext,
  provider: EventsProvider,
): void {
  // Register refresh command
  const refreshCommand = vscode.commands.registerCommand(
    'unhook.events.refresh',
    () => {
      log('Refreshing webhook events');
      provider.refresh();
    },
  );

  // Add collapse/expand all command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'unhook.events.toggleCollapseAll',
      async () => {
        if (!eventsTreeView) {
          vscode.window.showWarningMessage(
            'Webhook Events view is not available.',
          );
          return;
        }
        // Get all root elements
        const rootItems = await provider.getChildren();
        if (isCollapsed) {
          // Expand all
          for (const item of rootItems) {
            eventsTreeView.reveal(item, {
              expand: true,
              focus: false,
              select: false,
            });
          }
        } else {
          // Collapse all
          for (const item of rootItems) {
            eventsTreeView.reveal(item, {
              expand: false,
              focus: false,
              select: false,
            });
          }
        }
        isCollapsed = !isCollapsed;
      },
    ),
  );

  // Add replay command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'unhook.replayEvent',
      async (item: EventItem) => {
        try {
          if (isDeliveryPaused()) {
            vscode.window.showWarningMessage(
              'Webhook delivery is paused. Enable delivery to replay events.',
            );
            return;
          }

          vscode.window.showInformationMessage(
            `Replaying event ${item.event.id}...`,
          );

          // Get the API and config from the provider
          const authStore = provider.authStore;
          if (!authStore) throw new Error('Not authenticated');
          const api = authStore.api;
          const config = await provider.getConfig();
          if (!config) throw new Error('No config loaded');

          // Update event status and retry count
          await api.events.updateEventStatus.mutate({
            eventId: item.event.id,
            status: 'processing',
            retryCount: (item.event.retryCount ?? 0) + 1,
          });

          // Use the shared delivery utilities
          await createRequestsForEventToAllDestinations({
            event: item.event,
            delivery: config.delivery,
            destination: config.destination,
            api,
            isEventRetry: true,
            pingEnabledFn: (destination) => !!destination.ping,
            onRequestCreated: async (request) => {
              await handlePendingRequest({
                request: request,
                delivery: config.delivery,
                destination: config.destination,
                api,
                requestFn: async (url, options) => {
                  const response = await fetch(url, options);
                  const responseText = await response.text();
                  return {
                    body: { text: () => Promise.resolve(responseText) },
                    statusCode: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                  };
                },
              });
            },
          });

          // Optionally, refetch events to update the UI
          provider.refresh();

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
      async (item: EventItem) => {
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
      async (item: EventItem) => {
        try {
          log('Opening event details', { eventId: item.event.id });

          // Get the first request from the event
          const firstRequest = item.event.requests?.[0];
          if (firstRequest) {
            // Show the request details in a panel
            await requestDetailsWebviewProvider.show(firstRequest);
          } else {
            vscode.window.showWarningMessage(
              'No request data available for this event.',
            );
          }

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
      async (item: RequestItem) => {
        try {
          log('View request command called', {
            item: item ? 'present' : 'undefined',
            hasRequest: item?.request ? 'yes' : 'no',
            itemType: typeof item,
            itemConstructor: item?.constructor?.name,
          });

          // Guard against undefined item
          if (!item) {
            log('View request command called without item');
            vscode.window.showErrorMessage(
              'No request item provided to view command',
            );
            return;
          }

          // Guard against missing request property
          if (!item.request) {
            log(
              'View request command called with item missing request property',
              {
                item,
                itemKeys: Object.keys(item || {}),
                itemType: typeof item,
                itemConstructor: item?.constructor?.name,
              },
            );
            vscode.window.showErrorMessage(
              'Request item is missing request data',
            );
            return;
          }

          log('Opening request details', { requestId: item.request.id });

          // Show the request details in a panel
          await requestDetailsWebviewProvider.show(item.request);

          log('Request details shown successfully', {
            requestId: item.request.id,
          });
        } catch (error) {
          log('Failed to open request details', {
            requestId: item?.request?.id,
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
      async (item: RequestItem) => {
        try {
          if (isDeliveryPaused()) {
            vscode.window.showWarningMessage(
              'Webhook delivery is paused. Enable delivery to replay requests.',
            );
            return;
          }

          // Show a loading message
          vscode.window.showInformationMessage(
            `Replaying request ${item.request.id}...`,
          );

          // Get the API and config from the provider
          const authStore = provider.authStore;
          if (!authStore) throw new Error('Not authenticated');
          const api = authStore.api;
          const config = await provider.getConfig();
          if (!config) throw new Error('No config loaded');
          if (!item.request.webhookId) throw new Error('No webhook ID found');
          if (!item.request.eventId) throw new Error('No event ID found');

          // Create a new request with the same data
          const newRequest = await api.requests.create.mutate({
            webhookId: item.request.webhookId,
            eventId: item.request.eventId,
            apiKey: item.request.apiKey ?? undefined,
            request: item.request.request,
            source: item.request.source,
            destination: item.request.destination,
            timestamp: new Date(),
            status: 'pending',
            responseTimeMs: 0,
          });

          // Handle the pending request using the delivery utility
          await handlePendingRequest({
            request: newRequest,
            delivery: config.delivery,
            destination: config.destination,
            api,
            requestFn: async (url, options) => {
              const response = await fetch(url, options);
              const responseText = await response.text();
              return {
                body: { text: () => Promise.resolve(responseText) },
                statusCode: response.status,
                headers: Object.fromEntries(response.headers.entries()),
              };
            },
          });

          // Refresh the view to show the new request
          provider.refresh();

          vscode.window.showInformationMessage(
            `Request ${item.request.id} replayed successfully`,
          );
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to replay request: ${error}`);
        }
      },
    ),
  );

  context.subscriptions.push(refreshCommand);

  // Register filter command
  const filterCommand = vscode.commands.registerCommand(
    'unhook.events.filter',
    async () => {
      // TODO: Implement filter command
      vscode.window.showInformationMessage(
        'Filter command not implemented yet',
      );
    },
  );
  context.subscriptions.push(filterCommand);
}
