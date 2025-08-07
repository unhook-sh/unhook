import * as vscode from 'vscode';

export class LoadingItem extends vscode.TreeItem {
  constructor(context: vscode.ExtensionContext) {
    super('Loading events...', vscode.TreeItemCollapsibleState.None);

    // Use custom SVG with spinning animation
    this.iconPath = {
      dark: vscode.Uri.file(context.asAbsolutePath('media/loading.svg')),
      light: vscode.Uri.file(context.asAbsolutePath('media/loading.svg')),
    };

    this.contextValue = 'unhook.loading';
    this.resourceUri = vscode.Uri.parse('unhook://loading');
    this.tooltip = new vscode.MarkdownString(
      'Loading events from the server...',
    );
    this.tooltip.isTrusted = true;
  }
}
