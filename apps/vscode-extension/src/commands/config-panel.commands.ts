import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import type { ConfigProvider } from '../providers/config.provider';
import { ConfigDetailItem } from '../tree-items/config.item';

const log = debug('unhook:vscode:config-panel-commands');

export function registerConfigPanelCommands(
  context: vscode.ExtensionContext,
  provider: ConfigProvider,
): void {
  // Register refresh command
  const refreshCommand = vscode.commands.registerCommand(
    'unhook.config.refresh',
    () => {
      log('Refreshing configuration');
      provider.refresh();
    },
  );

  // Register copy config value command
  const copyConfigValueCommand = vscode.commands.registerCommand(
    'unhook.copyConfigValue',
    (item: vscode.TreeItem) => {
      if (item instanceof ConfigDetailItem) {
        const value =
          typeof item.value === 'object'
            ? JSON.stringify(item.value)
            : String(item.value);
        vscode.env.clipboard.writeText(value);
        vscode.window.showInformationMessage(`Copied: ${value}`);
        log('Copied config value to clipboard', { key: item.key, value });
      }
    },
  );

  // Register open config file command
  const openConfigFileCommand = vscode.commands.registerCommand(
    'unhook.openConfigFile',
    () => {
      const configPath = provider.getConfigPath();
      if (configPath) {
        vscode.workspace.openTextDocument(configPath).then((document) => {
          vscode.window.showTextDocument(document);
        });
        log('Opening config file', { configPath });
      } else {
        vscode.window.showWarningMessage('No configuration file found');
      }
    },
  );

  context.subscriptions.push(
    refreshCommand,
    copyConfigValueCommand,
    openConfigFileCommand,
  );
}
