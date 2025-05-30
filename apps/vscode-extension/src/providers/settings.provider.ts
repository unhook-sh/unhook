import * as vscode from 'vscode';
import { SettingsItem } from '../tree-items/settings.item';

export class SettingsProvider implements vscode.TreeDataProvider<SettingsItem> {
  getTreeItem(element: SettingsItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SettingsItem): Thenable<SettingsItem[]> {
    if (!element) {
      // Root level: Environments, Secrets, Variables
      return Promise.resolve([
        new SettingsItem(
          'Environments',
          vscode.TreeItemCollapsibleState.Expanded,
          'briefcase',
        ),
        new SettingsItem(
          'Secrets',
          vscode.TreeItemCollapsibleState.None,
          'lock',
        ),
        new SettingsItem(
          'Variables',
          vscode.TreeItemCollapsibleState.None,
          'symbol-key',
        ),
      ]);
    }
    if (element.label === 'Environments') {
      return Promise.resolve([
        new SettingsItem('Preview', vscode.TreeItemCollapsibleState.Collapsed),
        new SettingsItem(
          'Production',
          vscode.TreeItemCollapsibleState.Collapsed,
        ),
        new SettingsItem(
          'staging - docs',
          vscode.TreeItemCollapsibleState.Collapsed,
        ),
      ]);
    }
    if (
      element.label === 'Preview' ||
      element.label === 'Production' ||
      element.label === 'staging - docs'
    ) {
      return Promise.resolve([
        new SettingsItem(
          'Secrets',
          vscode.TreeItemCollapsibleState.None,
          'lock',
        ),
        new SettingsItem(
          'Variables',
          vscode.TreeItemCollapsibleState.None,
          'symbol-key',
        ),
      ]);
    }
    return Promise.resolve([]);
  }
}
