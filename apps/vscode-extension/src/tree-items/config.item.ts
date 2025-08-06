import * as vscode from 'vscode';

export class ConfigSectionItem extends vscode.TreeItem {
  constructor(
    public sectionName: string,
    public sectionData: unknown,
    public context: vscode.ExtensionContext,
  ) {
    super(sectionName, vscode.TreeItemCollapsibleState.Collapsed);

    this.iconPath = new vscode.ThemeIcon('settings-gear');
    this.contextValue = 'unhook.config.section';
    this.resourceUri = vscode.Uri.parse('unhook://config');

    // Set description based on section type
    if (sectionName === 'webhookId') {
      this.description = String(sectionData);
      this.collapsibleState = vscode.TreeItemCollapsibleState.None;
      this.iconPath = new vscode.ThemeIcon('key');
    } else if (sectionName === 'destination' && Array.isArray(sectionData)) {
      this.description = `${sectionData.length} endpoint${sectionData.length !== 1 ? 's' : ''}`;
      this.iconPath = new vscode.ThemeIcon('server');
    } else if (sectionName === 'delivery' && Array.isArray(sectionData)) {
      this.description = `${sectionData.length} rule${sectionData.length !== 1 ? 's' : ''}`;
      this.iconPath = new vscode.ThemeIcon('arrow-right');
    } else if (sectionName === 'source' && Array.isArray(sectionData)) {
      this.description = `${sectionData.length} source${sectionData.length !== 1 ? 's' : ''}`;
      this.iconPath = new vscode.ThemeIcon('inbox');
    } else if (sectionName === 'debug') {
      this.description =
        typeof sectionData === 'boolean'
          ? sectionData
            ? 'enabled'
            : 'disabled'
          : 'configured';
      this.iconPath = new vscode.ThemeIcon(sectionData ? 'bug' : 'bug');
    } else if (sectionName === 'telemetry') {
      this.description =
        typeof sectionData === 'boolean'
          ? sectionData
            ? 'enabled'
            : 'disabled'
          : 'configured';
      this.iconPath = new vscode.ThemeIcon('graph');
    } else if (sectionName === 'validation' && Array.isArray(sectionData)) {
      this.description = `${sectionData.length} error${sectionData.length !== 1 ? 's' : ''}`;
      this.iconPath = new vscode.ThemeIcon('error');
    } else if (
      sectionName === 'user' &&
      typeof sectionData === 'object' &&
      sectionData !== null
    ) {
      const user = sectionData as {
        email: string;
        firstName?: string;
        lastName?: string;
      };
      this.description = user.email;
      this.iconPath = new vscode.ThemeIcon('account');
    } else if (
      sectionName === 'organization' &&
      typeof sectionData === 'object' &&
      sectionData !== null
    ) {
      const org = sectionData as { name: string };
      this.description = org.name;
      this.iconPath = new vscode.ThemeIcon('organization');
    } else if (
      sectionName === 'subscription' &&
      typeof sectionData === 'object' &&
      sectionData !== null
    ) {
      const subscription = sectionData as {
        status: string | null;
        isActive: boolean;
        isPaid: boolean;
      };
      if (subscription.status) {
        this.description = subscription.status;
        this.iconPath = new vscode.ThemeIcon(
          subscription.isActive ? 'check' : 'x',
        );
      } else {
        this.description = 'none';
        this.iconPath = new vscode.ThemeIcon('x');
      }
    } else if (sectionName === 'apiKeys' && Array.isArray(sectionData)) {
      this.description = `${sectionData.length} key${sectionData.length !== 1 ? 's' : ''}`;
      this.iconPath = new vscode.ThemeIcon('key');
    } else if (sectionName === 'connections' && Array.isArray(sectionData)) {
      const connectedCount = sectionData.filter(
        (conn: { isConnected: boolean }) => conn.isConnected,
      ).length;
      this.description = `${connectedCount}/${sectionData.length} connected`;
      this.iconPath = new vscode.ThemeIcon('plug');
    } else if (
      sectionName === 'usage' &&
      typeof sectionData === 'object' &&
      sectionData !== null
    ) {
      const usage = sectionData as {
        dailyEvents: number;
        monthlyEvents: number;
        isUnlimited: boolean;
        limit: number;
        period: 'day' | 'month';
        webhookCount: number;
      };
      if (usage.isUnlimited) {
        this.description = `${usage.monthlyEvents} events, ${usage.webhookCount} webhooks (unlimited)`;
      } else {
        this.description = `${usage.monthlyEvents}/${usage.limit} events, ${usage.webhookCount} webhooks`;
      }
      this.iconPath = new vscode.ThemeIcon('graph');
    } else if (
      sectionName === 'webhookAuthorization' &&
      typeof sectionData === 'object' &&
      sectionData !== null
    ) {
      const auth = sectionData as {
        isAuthorized: boolean;
        webhookId: string | null;
        hasPendingRequest: boolean;
      };
      if (auth.isAuthorized) {
        this.description = 'Authorized';
        this.iconPath = new vscode.ThemeIcon('check');
      } else if (auth.hasPendingRequest) {
        this.description = 'Access pending';
        this.iconPath = new vscode.ThemeIcon('clock');
      } else {
        this.description = 'Not authorized';
        this.iconPath = new vscode.ThemeIcon('error');
      }
    } else if (
      sectionName === 'config' &&
      typeof sectionData === 'object' &&
      sectionData !== null
    ) {
      const config = sectionData as {
        dashboardUrl: string;
        apiUrl: string;
        isSelfHosted: boolean;
        isDevelopment: boolean;
      };
      this.description = config.isDevelopment
        ? 'Development'
        : config.isSelfHosted
          ? 'Self-hosted'
          : 'Cloud';
      this.iconPath = new vscode.ThemeIcon('settings-gear');
    } else {
      this.description =
        typeof sectionData === 'boolean'
          ? sectionData
            ? 'enabled'
            : 'disabled'
          : 'configured';
    }

    this.tooltip = new vscode.MarkdownString(`**${sectionName}**`);
    this.tooltip.isTrusted = true;
    this.tooltip.supportHtml = true;
    this.tooltip.appendMarkdown('\n\n$(eye) View Details');
  }
}

export class ConfigDetailItem extends vscode.TreeItem {
  constructor(
    public key: string,
    public value: unknown,
    public context: vscode.ExtensionContext,
  ) {
    const displayValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value);
    super(`${key}: ${displayValue}`, vscode.TreeItemCollapsibleState.None);

    // Choose appropriate icon based on key type
    if (key.startsWith('Error ')) {
      this.iconPath = new vscode.ThemeIcon('error');
    } else if (key.includes('url')) {
      this.iconPath = new vscode.ThemeIcon('link');
    } else if (key.includes('name')) {
      this.iconPath = new vscode.ThemeIcon('tag');
    } else if (key.includes('source')) {
      this.iconPath = new vscode.ThemeIcon('inbox');
    } else if (key.includes('destination')) {
      this.iconPath = new vscode.ThemeIcon('server');
    } else if (key.includes('ping')) {
      this.iconPath = new vscode.ThemeIcon('pulse');
    } else if (key.includes('email')) {
      this.iconPath = new vscode.ThemeIcon('mail');
    } else if (key.includes('id')) {
      this.iconPath = new vscode.ThemeIcon('id-badge');
    } else if (key.includes('status')) {
      this.iconPath = new vscode.ThemeIcon('info');
    } else if (key.includes('isConnected')) {
      this.iconPath = new vscode.ThemeIcon(value ? 'check' : 'x');
    } else if (key.includes('isActive') || key.includes('isPaid')) {
      this.iconPath = new vscode.ThemeIcon(value ? 'check' : 'x');
    } else if (key.includes('key')) {
      this.iconPath = new vscode.ThemeIcon('key');
    } else if (key.includes('hostname')) {
      this.iconPath = new vscode.ThemeIcon('computer');
    } else if (key.includes('os')) {
      this.iconPath = new vscode.ThemeIcon('device-desktop');
    } else if (key.includes('version')) {
      this.iconPath = new vscode.ThemeIcon('tag');
    } else if (key.includes('connectedAt') || key.includes('lastUsedAt')) {
      this.iconPath = new vscode.ThemeIcon('clock');
    } else {
      this.iconPath = new vscode.ThemeIcon('symbol-field');
    }

    this.contextValue = 'unhook.config.detail';
    this.resourceUri = vscode.Uri.parse('unhook://config-detail');

    this.tooltip = new vscode.MarkdownString(`**${key}**`);
    this.tooltip.isTrusted = true;
    this.tooltip.supportHtml = true;
    this.tooltip.appendMarkdown(`\n\nValue: \`${displayValue}\``);
    this.tooltip.appendMarkdown('\n\n$(copy) Copy Value');
  }
}
