import * as vscode from 'vscode';

export class SettingsItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    iconId?: string,
  ) {
    super(label, collapsibleState);
    if (iconId) {
      this.iconPath = new vscode.ThemeIcon(iconId);
    }
  }
}
