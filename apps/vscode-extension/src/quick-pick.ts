import * as vscode from 'vscode';
// import { ConfigManager } from './config.manager';
import { env } from './env';
import type { AnalyticsService } from './services/analytics.service';
import type { AuthStore } from './services/auth.service';

export class EventQuickPick {
  private static instance: EventQuickPick;
  private authStore: AuthStore | null = null;
  private analyticsService: AnalyticsService | null = null;

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

  public setAnalyticsService(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
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
          description: 'Create a new webhook',
          detail: 'Create a new webhook and update configuration',
          label: '$(add) Create New Webhook',
        },
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
      description:
        'Create unhook.yml configuration file with webhook selection',
      detail:
        'Choose a webhook and generate a new Unhook configuration file for your project',
      label: '$(new-file) Create Configuration File',
    });

    // Add server configuration item
    items.push({
      description: 'Configure server URLs for cloud or self-hosted',
      detail: 'Set API and dashboard URLs for your Unhook instance',
      label: '$(settings-gear) Configure Server URLs',
    });

    // Add API key configuration item
    // API key will be resolved dynamically during MCP setup

    items.push({
      description: "Setup Cursor MCP server with your webhook's API key",
      detail: 'Automatically fetches the API key associated with your webhook',
      label: '$(key) Setup MCP Server',
    });

    // Only show one entry for MCP setup; it performs registration and file fallback

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
          // Track quick pick sign-in action
          this.analyticsService?.track('quick_pick_sign_in');
          await vscode.commands.executeCommand('unhook.signIn');
          break;
        case '$(sign-out) Sign Out':
          // Track quick pick sign-out action
          this.analyticsService?.track('quick_pick_sign_out');
          await vscode.commands.executeCommand('unhook.signOut');
          break;
        case '$(add) Add New Event':
          // Track quick pick add event action
          this.analyticsService?.track('quick_pick_add_event');
          await vscode.commands.executeCommand('unhook.addEvent');
          break;
        case '$(add) Create New Webhook':
          // Track quick pick create webhook action
          this.analyticsService?.track('quick_pick_create_webhook');
          await vscode.commands.executeCommand('unhook.createWebhook');
          break;
        case '$(refresh) Refresh Events':
          // Track quick pick refresh events action
          this.analyticsService?.track('quick_pick_refresh_events');
          await vscode.commands.executeCommand('unhook.events.refresh');
          break;
        case '$(new-file) Create Configuration File':
          // Track quick pick create config action
          this.analyticsService?.track('quick_pick_create_config');
          await vscode.commands.executeCommand('unhook.createConfig');
          break;
        case '$(settings-gear) Configure Server URLs':
          // Track quick pick configure server URLs action
          this.analyticsService?.track('quick_pick_configure_server_urls');
          await vscode.commands.executeCommand('unhook.configureServerUrls');
          break;
        case '$(key) Setup MCP Server':
          // Track quick pick MCP server setup action
          this.analyticsService?.track('quick_pick_mcp_server_setup');
          await vscode.commands.executeCommand('unhook.configureApiKey');
          break;
        case '$(server) Create Cursor MCP Server':
          await vscode.commands.executeCommand('unhook.createCursorMcpServer');
          break;
        case '$(settings) Configure Settings':
          // Track quick pick settings action
          this.analyticsService?.track('quick_pick_open_settings');
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
