import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import type { EventsProvider } from '../providers/events.provider';

const log = debug('unhook:vscode:polling-commands');

export function registerPollingCommands(
  _context: vscode.ExtensionContext,
  eventsProvider: EventsProvider,
) {
  const disposables: vscode.Disposable[] = [];

  // Start polling command
  const startPollingCommand = vscode.commands.registerCommand(
    'unhook.startPolling',
    async () => {
      log('Start polling command executed');
      const pollingService = eventsProvider.getPollingService();
      if (pollingService) {
        // Track polling start
        eventsProvider.getAnalyticsService()?.track('polling_started');
        pollingService.startPolling();
        vscode.window.showInformationMessage('Polling started');
      } else {
        vscode.window.showErrorMessage('Polling service not available');
      }
    },
  );
  disposables.push(startPollingCommand);

  // Pause polling command
  const pausePollingCommand = vscode.commands.registerCommand(
    'unhook.pausePolling',
    async () => {
      log('Pause polling command executed');
      const pollingService = eventsProvider.getPollingService();
      if (pollingService) {
        // Track polling pause
        eventsProvider.getAnalyticsService()?.track('polling_paused');
        pollingService.pausePolling();
        vscode.window.showInformationMessage('Polling paused');
      } else {
        vscode.window.showErrorMessage('Polling service not available');
      }
    },
  );
  disposables.push(pausePollingCommand);

  // Resume polling command
  const resumePollingCommand = vscode.commands.registerCommand(
    'unhook.resumePolling',
    async () => {
      log('Resume polling command executed');
      const pollingService = eventsProvider.getPollingService();
      if (pollingService) {
        // Track polling resume
        eventsProvider.getAnalyticsService()?.track('polling_resumed');
        pollingService.resumePolling();
        vscode.window.showInformationMessage('Polling resumed');
      } else {
        vscode.window.showErrorMessage('Polling service not available');
      }
    },
  );
  disposables.push(resumePollingCommand);

  // Stop polling command
  const stopPollingCommand = vscode.commands.registerCommand(
    'unhook.stopPolling',
    async () => {
      log('Stop polling command executed');
      const pollingService = eventsProvider.getPollingService();
      if (pollingService) {
        // Track polling stop
        eventsProvider.getAnalyticsService()?.track('polling_stopped');
        pollingService.stopPolling();
        vscode.window.showInformationMessage('Polling stopped');
      } else {
        vscode.window.showErrorMessage('Polling service not available');
      }
    },
  );
  disposables.push(stopPollingCommand);

  // Toggle polling command
  const togglePollingCommand = vscode.commands.registerCommand(
    'unhook.togglePolling',
    async () => {
      log('Toggle polling command executed');
      const pollingService = eventsProvider.getPollingService();
      if (pollingService) {
        if (pollingService.isPolling()) {
          // Track polling pause
          eventsProvider.getAnalyticsService()?.track('polling_toggled_pause');
          pollingService.pausePolling();
          vscode.window.showInformationMessage('Polling paused');
        } else {
          // Track polling resume
          eventsProvider.getAnalyticsService()?.track('polling_toggled_resume');
          pollingService.resumePolling();
          vscode.window.showInformationMessage('Polling resumed');
        }
      } else {
        vscode.window.showErrorMessage('Polling service not available');
      }
    },
  );
  disposables.push(togglePollingCommand);

  return { disposables };
}
