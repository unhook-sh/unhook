import * as vscode from 'vscode';
import { AnalyticsService } from '../services/analytics.service';
import type { AuthStore } from '../services/auth.service';

export class AnalyticsProvider implements vscode.Disposable {
  private analyticsService: AnalyticsService;
  private disposables: vscode.Disposable[] = [];
  private originalRegisterCommand: typeof vscode.commands.registerCommand =
    vscode.commands.registerCommand;

  constructor(context: vscode.ExtensionContext, authStore: AuthStore) {
    this.analyticsService = AnalyticsService.getInstance(context, authStore);

    // Register analytics integration
    this.registerEventHandlers();
    this.registerCommandDecorators();
  }

  static register(
    context: vscode.ExtensionContext,
    authStore: AuthStore,
  ): { provider: AnalyticsProvider; disposable: vscode.Disposable } {
    const provider = new AnalyticsProvider(context, authStore);
    return {
      disposable: provider,
      provider,
    };
  }

  private registerEventHandlers() {
    // Track workspace configuration changes and telemetry enablement only
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('unhook')) {
          this.analyticsService.track('workspace_config_changed', {
            sections: this.getChangedSections(e),
          });

          // Check if analytics setting changed
          if (e.affectsConfiguration('unhook.analytics.enabled')) {
            this.analyticsService.reinitialize();
          }
        }
      }),
    );

    // Listen for VS Code telemetry changes
    this.disposables.push(
      vscode.env.onDidChangeTelemetryEnabled(() => {
        this.analyticsService.reinitialize();
      }),
    );
  }

  private registerCommandDecorators() {
    // Decorate command registration to track executions
    this.originalRegisterCommand = vscode.commands.registerCommand;

    const analyticsService = this.analyticsService;
    vscode.commands.registerCommand = <T extends unknown[]>(
      command: string,
      callback: (...args: T) => unknown,
      thisArg?: unknown,
    ): vscode.Disposable => {
      const wrappedCallback = async (...args: T) => {
        const startTime = Date.now();

        try {
          // Track command execution
          analyticsService.trackCommand(command, {
            timestamp: new Date().toISOString(),
          });

          const result = await callback.apply(thisArg, args);

          // Track successful completion
          analyticsService.track('command_completed', {
            command,
            duration_ms: Date.now() - startTime,
            success: true,
          });

          return result;
        } catch (error) {
          // Track command failure
          analyticsService.track('command_failed', {
            command,
            duration_ms: Date.now() - startTime,
            error: (error as Error).message,
          });

          // Also track as exception
          analyticsService.trackException(error as Error, {
            args: args.length,
            command,
          });

          throw error;
        }
      };

      return this.originalRegisterCommand.call(
        vscode.commands,
        command,
        wrappedCallback,
        thisArg,
      );
    };
  }

  private getChangedSections(e: vscode.ConfigurationChangeEvent): string[] {
    const sections = [];
    const configs = [
      'unhook.configFilePath',
      'unhook.server.apiUrl',
      'unhook.server.dashboardUrl',
      'unhook.autoShowOutput',
      'unhook.autoClearEvents',
      'unhook.notifications',
      'unhook.analytics.enabled',
    ];

    for (const config of configs) {
      if (e.affectsConfiguration(config)) {
        sections.push(config);
      }
    }

    return sections;
  }

  public getAnalyticsService(): AnalyticsService {
    return this.analyticsService;
  }

  dispose() {
    // Restore original command registration
    if (this.originalRegisterCommand) {
      vscode.commands.registerCommand = this.originalRegisterCommand;
    }

    // Dispose all event handlers
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];

    // Dispose analytics service
    this.analyticsService.dispose();
  }
}
