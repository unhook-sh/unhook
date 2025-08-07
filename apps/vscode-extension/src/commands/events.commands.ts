import { extractBody } from '@unhook/client/utils/extract-body';
import { extractEventName } from '@unhook/client/utils/extract-event-name';
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

          const eventName =
            extractEventName(item.event.originRequest?.body) || 'Unknown';
          const source = item.event.source || 'Unknown';
          vscode.window.showInformationMessage(
            `Replaying event: ${eventName} from ${source}...`,
          );

          // Get the config from the provider
          const config = await provider.getConfig();
          if (!config) throw new Error('No config loaded');

          // Update event status and retry count
          const authStore = provider.authStore;
          if (!authStore) throw new Error('Not authenticated');
          await authStore.api.events.updateEventStatus.mutate({
            eventId: item.event.id,
            retryCount: (item.event.retryCount ?? 0) + 1,
            status: 'processing',
          });

          // Use the delivery service for consistent behavior and optimistic UI updates
          await provider.deliveryService.handleRealtimeEventDelivery(
            item.event,
            config,
          );

          vscode.window.showInformationMessage(
            `Event ${eventName} from ${source} replayed successfully`,
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
          // Create a copy of the event data with decoded body
          const eventData = { ...item.event };

          // Decode the base64 body if it exists
          if (eventData.originRequest?.body) {
            const decodedBody = extractBody(eventData.originRequest.body);
            if (decodedBody) {
              eventData.originRequest.body = decodedBody;
            }
          }

          const eventDataString = JSON.stringify(eventData, null, 2);
          await vscode.env.clipboard.writeText(eventDataString);
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

          // Show the event details in a panel
          await requestDetailsWebviewProvider.showEvent(item.event);

          log('Event details shown successfully', { eventId: item.event.id });
        } catch (error) {
          log('Failed to open event details', {
            error,
            eventId: item.event.id,
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
            hasRequest: item?.request ? 'yes' : 'no',
            item: item ? 'present' : 'undefined',
            itemConstructor: item?.constructor?.name,
            itemType: typeof item,
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
                itemConstructor: item?.constructor?.name,
                itemKeys: Object.keys(item || {}),
                itemType: typeof item,
              },
            );
            vscode.window.showErrorMessage(
              'Request item is missing request data',
            );
            return;
          }

          log('Opening request details', { requestId: item.request.id });

          // Fetch complete request data from API to ensure we have all fields
          const authStore = provider.authStore;
          if (authStore?.isSignedIn) {
            try {
              log('Fetching complete request data from API', {
                requestId: item.request.id,
              });
              const completeRequest =
                await authStore.api.requests.byIdWithEvent.query({
                  id: item.request.id,
                });

              if (completeRequest) {
                log('Successfully fetched complete request data', {
                  hasEvent: !!completeRequest.event,
                  hasOriginRequest: !!completeRequest.event?.originRequest,
                  hasResponse: !!completeRequest.response,
                  requestBody: completeRequest.event?.originRequest?.body
                    ? 'PRESENT'
                    : 'MISSING',
                  requestId: completeRequest.id,
                  responseBody: completeRequest.response?.body
                    ? 'PRESENT'
                    : 'MISSING',
                });

                // Show the complete request details in a panel
                await requestDetailsWebviewProvider.show({
                  event: item.parent.event,
                  request: completeRequest,
                });
              } else {
                log('No request found with ID, using existing data', {
                  requestId: item.request.id,
                });
                // Fallback to existing data if API fetch fails
                await requestDetailsWebviewProvider.show({
                  event: item.parent.event,
                  request: item.request,
                });
              }
            } catch (error) {
              log(
                'Failed to fetch complete request data from API, using existing data',
                {
                  error,
                  requestId: item.request.id,
                },
              );
              // Fallback to existing data if API fetch fails
              await requestDetailsWebviewProvider.show({
                event: item.parent.event,
                request: item.request,
              });
            }
          } else {
            log('Not authenticated, using existing request data', {
              requestId: item.request.id,
            });
            // Show the existing request details in a panel
            await requestDetailsWebviewProvider.show({
              event: item.parent.event,
              request: item.request,
            });
          }

          log('Request details shown successfully', {
            requestId: item.request.id,
          });
        } catch (error) {
          log('Failed to open request details', {
            error,
            requestId: item?.request?.id,
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

          // Extract event name and source for notifications
          const eventName =
            extractEventName(item.parent.event.originRequest?.body) ||
            'Unknown';
          const source = item.parent.event.source || 'Unknown';

          // Show a loading message with event name and source
          vscode.window.showInformationMessage(
            `Replaying request: ${eventName} from ${source}...`,
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
            apiKeyId: item.request.apiKeyId ?? undefined,
            destination: item.request.destination,
            destinationName: item.request.destination.name,
            destinationUrl: item.request.destination.url,
            eventId: item.request.eventId,
            responseTimeMs: 0,
            source: item.request.source,
            status: 'pending',
            timestamp: new Date(),
            webhookId: item.request.webhookId,
          });

          // Use the delivery service for consistent behavior and optimistic UI updates
          await provider.deliveryService.handleSingleRequestReplay(
            newRequest,
            item.parent.event,
            config,
          );

          vscode.window.showInformationMessage(
            `Request ${eventName} replayed successfully`,
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
      const currentFilter = provider.getCurrentFilter();

      const items: vscode.QuickPickItem[] = [
        {
          description: 'Enter text to filter events',
          detail:
            'Filter events by ID, source, status, failed reason, or webhook ID',
          label: '$(search) Set Filter',
        },
        {
          description: 'Remove current filter',
          detail: currentFilter
            ? `Currently filtering: "${currentFilter}"`
            : 'No active filter',
          label: '$(clear-all) Clear Filter',
        },
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select filter action',
        title: 'Filter Events',
      });

      if (selected) {
        switch (selected.label) {
          case '$(search) Set Filter': {
            const filterText = await vscode.window.showInputBox({
              placeHolder:
                'Enter filter text (ID, source, status, failed reason, or webhook ID)',
              prompt:
                'Filter events by ID, source, status, failed reason, or webhook ID',
              value: currentFilter,
            });

            if (filterText !== undefined) {
              provider.setFilter(filterText);
              if (filterText) {
                vscode.window.showInformationMessage(
                  `Filter applied: "${filterText}"`,
                );
              } else {
                vscode.window.showInformationMessage('Filter cleared');
              }
            }
            break;
          }

          case '$(clear-all) Clear Filter':
            provider.setFilter('');
            vscode.window.showInformationMessage('Filter cleared');
            break;
        }
      }
    },
  );
  context.subscriptions.push(filterCommand);
}
