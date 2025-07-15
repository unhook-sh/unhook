import * as vscode from 'vscode';
import { env } from './env';
import type { AuthStore } from './services/auth.service';

export class EventQuickPick {
  private static instance: EventQuickPick;
  private authStore: AuthStore | null = null;

  private constructor() {}

  public static getInstance(): EventQuickPick {
    if (!EventQuickPick.instance) {
      EventQuickPick.instance = new EventQuickPick();
    }
    return EventQuickPick.instance;
  }

  public setAuthStore(authStore: AuthStore) {
    this.authStore = authStore;
  }

  public async showQuickPick() {
    const items: vscode.QuickPickItem[] = [];

    // Add auth items based on current state
    if (this.authStore) {
      if (this.authStore.isValidatingSession) {
        items.push({
          description: 'Please wait while we validate your session',
          detail: 'Your session is being validated...',
          label: '$(sync~spin) Validating Session',
        });
      } else if (this.authStore.isSignedIn) {
        items.push({
          description: 'Sign out of your Unhook account',
          detail: `Currently signed in as ${this.authStore.user?.email ?? 'User'}`,
          label: '$(sign-out) Sign Out',
        });
      } else {
        items.push({
          description: 'Sign in to your Unhook account',
          detail: 'Sign in to access your webhook events',
          label: '$(sign-in) Sign In',
        });
      }
    }

    // Add webhook event items if signed in
    if (this.authStore?.isSignedIn) {
      items.push(
        {
          description: 'Create a new event',
          detail: 'Add a new event to the list',
          label: '$(add) Add New Event',
        },
        {
          description: 'Refresh the events list',
          detail: 'Update the list of events',
          label: '$(refresh) Refresh Events',
        },
      );
    }

    // Add configuration items
    items.push({
      description: 'Create unhook.yml configuration file',
      detail: 'Generate a new Unhook configuration file for your project',
      label: '$(new-file) Create Configuration File',
    });

    // Add MCP configuration item if signed in
    if (this.authStore?.isSignedIn) {
      items.push({
        description: 'Create Cursor MCP configuration',
        detail: 'Generate MCP configuration for Cursor AI assistant',
        label: '$(server) Create MCP Config',
      });
    }

    // Add settings item
    items.push({
      description: 'Open settings panel',
      detail: 'Configure Unhook extension settings',
      label: '$(settings) Configure Settings',
    });

    const selected = await vscode.window.showQuickPick(items, {
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: 'Select an action',
      title: 'Unhook Quick Actions',
    });

    if (selected) {
      switch (selected.label) {
        case '$(sign-in) Sign In':
          await vscode.commands.executeCommand('unhook.signIn');
          break;
        case '$(sign-out) Sign Out':
          await vscode.commands.executeCommand('unhook.signOut');
          break;
        case '$(add) Add New Event':
          await vscode.commands.executeCommand('unhook.addEvent');
          break;
        case '$(refresh) Refresh Events':
          await vscode.commands.executeCommand('unhook.events.refresh');
          break;
        case '$(new-file) Create Configuration File':
          await vscode.commands.executeCommand('unhook.createConfig');
          break;
        case '$(server) Create MCP Config':
          await vscode.commands.executeCommand('unhook.createMcpConfig');
          break;
        case '$(settings) Configure Settings':
          await vscode.commands.executeCommand(
            'workbench.action.openSettings',
            `@ext:${env.NEXT_PUBLIC_VSCODE_EXTENSION_ID}`,
          );
          break;
        case '$(play) Toggle Webhook Delivery':
          await vscode.commands.executeCommand('unhook.toggleDelivery');
          break;
      }
    }
  }
}
