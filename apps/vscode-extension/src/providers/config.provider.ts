import type { WebhookConfig } from '@unhook/client/config';
import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { ConfigDetailItem, ConfigSectionItem } from '../tree-items/config.item';

const log = debug('unhook:vscode:config-provider');

interface DevInfo {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  org?: {
    id: string;
    name: string;
  };
  subscription?: {
    status: string | null;
    customerId: string | null;
    subscriptionId: string | null;
    isActive: boolean;
    isPaid: boolean;
    isTrialing: boolean;
    isCanceled: boolean;
    isPastDue: boolean;
  };
  apiKeys?: Array<{
    id: string;
    name: string;
    key: string;
    isActive: boolean;
    lastUsedAt?: string;
  }>;
  connections?: Array<{
    id: string;
    clientId: string;
    clientHostname?: string;
    clientOs?: string;
    clientVersion?: string;
    connectedAt: string;
    isConnected: boolean;
  }>;
  usage?: {
    dailyEvents: number;
    monthlyEvents: number;
    isUnlimited: boolean;
    limit: number;
    period: 'day' | 'month';
  };
}

export class ConfigProvider
  implements vscode.TreeDataProvider<ConfigSectionItem | ConfigDetailItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ConfigSectionItem | ConfigDetailItem | undefined
  > = new vscode.EventEmitter<
    ConfigSectionItem | ConfigDetailItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<
    ConfigSectionItem | ConfigDetailItem | undefined
  > = this._onDidChangeTreeData.event;

  private config: WebhookConfig | null = null;
  private configPath: string | null = null;
  private configWatcher: vscode.FileSystemWatcher | null = null;
  private validationErrors: string[] = [];
  private devInfo: DevInfo = {};
  private isDevelopmentMode = false;

  constructor(private context: vscode.ExtensionContext) {
    log('Initializing ConfigProvider');
    // Check if we're in development mode
    this.isDevelopmentMode = process.env.NODE_ENV === 'development';
  }

  public setConfig(config: WebhookConfig | null, configPath: string) {
    log('Setting config', { configPath, webhookId: config?.webhookId });
    this.config = config;
    this.configPath = configPath;
    if (configPath) {
      this.setupConfigWatcher(configPath);
    }
    this.validateConfig();
    this.refresh();
  }

  public setDevInfo(devInfo: DevInfo) {
    log('Setting dev info', { hasOrg: !!devInfo.org, hasUser: !!devInfo.user });
    this.devInfo = devInfo;
    this.refresh();
  }

  public getTreeItem(
    element: ConfigSectionItem | ConfigDetailItem,
  ): vscode.TreeItem {
    return element;
  }

  public async getChildren(
    element?: ConfigSectionItem | ConfigDetailItem,
  ): Promise<(ConfigSectionItem | ConfigDetailItem)[]> {
    if (element instanceof ConfigSectionItem) {
      // Return details for this section
      return this.getSectionDetails(element.sectionName, element.sectionData);
    }

    // Root level - show config sections
    const sections: ConfigSectionItem[] = [];

    // Add validation status if there are errors
    if (this.validationErrors.length > 0) {
      sections.push(
        new ConfigSectionItem(
          'validation',
          this.validationErrors,
          this.context,
        ),
      );
    }

    // Add development information in development mode
    if (this.isDevelopmentMode) {
      if (this.devInfo.user) {
        sections.push(
          new ConfigSectionItem('user', this.devInfo.user, this.context),
        );
      }
      if (this.devInfo.org) {
        sections.push(
          new ConfigSectionItem('organization', this.devInfo.org, this.context),
        );
      }
      if (this.devInfo.subscription) {
        sections.push(
          new ConfigSectionItem(
            'subscription',
            this.devInfo.subscription,
            this.context,
          ),
        );
      }
      if (this.devInfo.usage) {
        sections.push(
          new ConfigSectionItem('usage', this.devInfo.usage, this.context),
        );
      }
      if (this.devInfo.apiKeys && this.devInfo.apiKeys.length > 0) {
        sections.push(
          new ConfigSectionItem('apiKeys', this.devInfo.apiKeys, this.context),
        );
      }
      if (this.devInfo.connections && this.devInfo.connections.length > 0) {
        sections.push(
          new ConfigSectionItem(
            'connections',
            this.devInfo.connections,
            this.context,
          ),
        );
      }
    }

    // Add webhookId as a special section
    if (this.config?.webhookId) {
      sections.push(
        new ConfigSectionItem('webhookId', this.config.webhookId, this.context),
      );
    }

    // Add destination section
    if (this.config?.destination && this.config.destination.length > 0) {
      sections.push(
        new ConfigSectionItem(
          'destination',
          this.config.destination,
          this.context,
        ),
      );
    }

    // Add delivery section
    if (this.config?.delivery && this.config.delivery.length > 0) {
      sections.push(
        new ConfigSectionItem('delivery', this.config.delivery, this.context),
      );
    }

    // Add source section
    if (this.config?.source && this.config.source.length > 0) {
      sections.push(
        new ConfigSectionItem('source', this.config.source, this.context),
      );
    }

    // Add other config options
    if (this.config?.debug !== undefined) {
      sections.push(
        new ConfigSectionItem('debug', this.config.debug, this.context),
      );
    }

    if (this.config?.telemetry !== undefined) {
      sections.push(
        new ConfigSectionItem('telemetry', this.config.telemetry, this.context),
      );
    }

    return sections;
  }

  private getSectionDetails(
    sectionName: string,
    sectionData: unknown,
  ): ConfigDetailItem[] {
    const details: ConfigDetailItem[] = [];

    if (sectionName === 'webhookId') {
      // webhookId is already displayed as a leaf node
      return [];
    }

    if (sectionName === 'validation' && Array.isArray(sectionData)) {
      // Show validation errors
      sectionData.forEach((error, index) => {
        details.push(
          new ConfigDetailItem(`Error ${index + 1}`, error, this.context),
        );
      });
      return details;
    }

    if (
      sectionName === 'user' &&
      typeof sectionData === 'object' &&
      sectionData !== null
    ) {
      // Show user details
      const user = sectionData as DevInfo['user'];
      if (user) {
        details.push(new ConfigDetailItem('id', user.id, this.context));
        details.push(new ConfigDetailItem('email', user.email, this.context));
        if (user.firstName)
          details.push(
            new ConfigDetailItem('firstName', user.firstName, this.context),
          );
        if (user.lastName)
          details.push(
            new ConfigDetailItem('lastName', user.lastName, this.context),
          );
      }
      return details;
    }

    if (
      sectionName === 'organization' &&
      typeof sectionData === 'object' &&
      sectionData !== null
    ) {
      // Show organization details
      const org = sectionData as DevInfo['org'];
      if (org) {
        details.push(new ConfigDetailItem('id', org.id, this.context));
        details.push(new ConfigDetailItem('name', org.name, this.context));
      }
      return details;
    }

    if (
      sectionName === 'subscription' &&
      typeof sectionData === 'object' &&
      sectionData !== null
    ) {
      // Show subscription details
      const subscription = sectionData as DevInfo['subscription'];
      if (subscription) {
        details.push(
          new ConfigDetailItem(
            'status',
            subscription.status || 'none',
            this.context,
          ),
        );
        details.push(
          new ConfigDetailItem(
            'customerId',
            subscription.customerId || 'none',
            this.context,
          ),
        );
        details.push(
          new ConfigDetailItem(
            'subscriptionId',
            subscription.subscriptionId || 'none',
            this.context,
          ),
        );
        details.push(
          new ConfigDetailItem('isActive', subscription.isActive, this.context),
        );
        details.push(
          new ConfigDetailItem('isPaid', subscription.isPaid, this.context),
        );
        details.push(
          new ConfigDetailItem(
            'isTrialing',
            subscription.isTrialing,
            this.context,
          ),
        );
        details.push(
          new ConfigDetailItem(
            'isCanceled',
            subscription.isCanceled,
            this.context,
          ),
        );
        details.push(
          new ConfigDetailItem(
            'isPastDue',
            subscription.isPastDue,
            this.context,
          ),
        );
      }
      return details;
    }

    if (
      sectionName === 'usage' &&
      typeof sectionData === 'object' &&
      sectionData !== null
    ) {
      // Show usage details
      const usage = sectionData as DevInfo['usage'];
      if (usage) {
        details.push(
          new ConfigDetailItem(
            'dailyEvents',
            `${usage.dailyEvents} events`,
            this.context,
          ),
        );
        details.push(
          new ConfigDetailItem(
            'monthlyEvents',
            `${usage.monthlyEvents} events`,
            this.context,
          ),
        );
        details.push(
          new ConfigDetailItem('isUnlimited', usage.isUnlimited, this.context),
        );
        if (!usage.isUnlimited) {
          details.push(
            new ConfigDetailItem(
              'limit',
              `${usage.limit} events per ${usage.period}`,
              this.context,
            ),
          );
        } else {
          details.push(
            new ConfigDetailItem('limit', 'Unlimited', this.context),
          );
        }
        details.push(
          new ConfigDetailItem('period', usage.period, this.context),
        );
      }
      return details;
    }

    if (sectionName === 'apiKeys' && Array.isArray(sectionData)) {
      // Show API keys
      sectionData.forEach((apiKey, index) => {
        if (typeof apiKey === 'object' && apiKey !== null) {
          const key = apiKey as NonNullable<DevInfo['apiKeys']>[0];
          details.push(
            new ConfigDetailItem(`${index}.name`, key.name, this.context),
          );
          details.push(
            new ConfigDetailItem(`${index}.id`, key.id, this.context),
          );
          details.push(
            new ConfigDetailItem(
              `${index}.key`,
              `${key.key.substring(0, 8)}...`,
              this.context,
            ),
          );
          details.push(
            new ConfigDetailItem(
              `${index}.isActive`,
              key.isActive,
              this.context,
            ),
          );
          if (key.lastUsedAt) {
            details.push(
              new ConfigDetailItem(
                `${index}.lastUsedAt`,
                key.lastUsedAt,
                this.context,
              ),
            );
          }
        }
      });
      return details;
    }

    if (sectionName === 'connections' && Array.isArray(sectionData)) {
      // Show connections
      sectionData.forEach((connection, index) => {
        if (typeof connection === 'object' && connection !== null) {
          const conn = connection as NonNullable<DevInfo['connections']>[0];
          details.push(
            new ConfigDetailItem(`${index}.id`, conn.id, this.context),
          );
          details.push(
            new ConfigDetailItem(
              `${index}.clientId`,
              conn.clientId,
              this.context,
            ),
          );
          details.push(
            new ConfigDetailItem(
              `${index}.isConnected`,
              conn.isConnected,
              this.context,
            ),
          );
          if (conn.clientHostname) {
            details.push(
              new ConfigDetailItem(
                `${index}.hostname`,
                conn.clientHostname,
                this.context,
              ),
            );
          }
          if (conn.clientOs) {
            details.push(
              new ConfigDetailItem(`${index}.os`, conn.clientOs, this.context),
            );
          }
          if (conn.clientVersion) {
            details.push(
              new ConfigDetailItem(
                `${index}.version`,
                conn.clientVersion,
                this.context,
              ),
            );
          }
          details.push(
            new ConfigDetailItem(
              `${index}.connectedAt`,
              conn.connectedAt,
              this.context,
            ),
          );
        }
      });
      return details;
    }

    if (Array.isArray(sectionData)) {
      // For arrays, show each item with its index
      sectionData.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          // For objects, show each property
          Object.entries(item).forEach(([key, value]) => {
            details.push(
              new ConfigDetailItem(`${index}.${key}`, value, this.context),
            );
          });
        } else {
          details.push(new ConfigDetailItem(`${index}`, item, this.context));
        }
      });
    } else if (typeof sectionData === 'object' && sectionData !== null) {
      // For objects, show each property
      Object.entries(sectionData).forEach(([key, value]) => {
        details.push(new ConfigDetailItem(key, value, this.context));
      });
    } else {
      // For primitive values, show the value
      details.push(new ConfigDetailItem('value', sectionData, this.context));
    }

    return details;
  }

  private validateConfig() {
    this.validationErrors = [];

    if (!this.config) {
      this.validationErrors.push('No configuration loaded');
      return;
    }

    // Validate webhookId
    if (!this.config.webhookId || this.config.webhookId.trim() === '') {
      this.validationErrors.push('Missing or empty webhookId');
    }

    // Validate destination
    if (!this.config.destination || this.config.destination.length === 0) {
      this.validationErrors.push('No destinations configured');
    } else {
      this.config.destination.forEach((dest, index) => {
        if (!dest.name || dest.name.trim() === '') {
          this.validationErrors.push(`Destination ${index + 1}: Missing name`);
        }
        if (!dest.url) {
          this.validationErrors.push(`Destination ${index + 1}: Missing URL`);
        }
      });
    }

    // Validate delivery rules
    if (!this.config.delivery || this.config.delivery.length === 0) {
      this.validationErrors.push('No delivery rules configured');
    } else {
      this.config.delivery.forEach((rule, index) => {
        if (!rule.destination || rule.destination.trim() === '') {
          this.validationErrors.push(
            `Delivery rule ${index + 1}: Missing destination`,
          );
        }
        // Check if destination exists
        if (
          this.config?.destination &&
          !this.config.destination.find((d) => d.name === rule.destination)
        ) {
          this.validationErrors.push(
            `Delivery rule ${index + 1}: Destination "${rule.destination}" not found`,
          );
        }
      });
    }

    log('Config validation completed', {
      errorCount: this.validationErrors.length,
    });
  }

  public refresh(): void {
    log('Refreshing config tree data');
    this._onDidChangeTreeData.fire(undefined);
  }

  private setupConfigWatcher(configPath: string) {
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }
    if (!configPath) return;

    this.configWatcher = vscode.workspace.createFileSystemWatcher(configPath);
    this.configWatcher.onDidChange(() => this.onConfigFileChanged());
    this.configWatcher.onDidCreate(() => this.onConfigFileChanged());
    this.configWatcher.onDidDelete(() => this.onConfigFileChanged());
  }

  private onConfigFileChanged() {
    log('Config file changed, clearing cached config');
    this.config = null;
    this.configPath = null;
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }
    this.refresh();
  }

  public getConfig(): WebhookConfig | null {
    return this.config;
  }

  public getConfigPath(): string | null {
    return this.configPath;
  }

  public getValidationErrors(): string[] {
    return this.validationErrors;
  }
}
