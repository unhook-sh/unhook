import type {
  ApiKeyType,
  ConnectionType,
  OrgMembersType,
  OrgType,
  UserType,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import type * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';
import type { ConfigProvider } from '../providers/config.provider';
import type { AuthStore } from './auth.service';
import type { PollingService, PollingState } from './polling.service';
import { WebhookAuthorizationService } from './webhook-authorization.service';

const log = debug('unhook:vscode:dev-info-service');

interface DevInfo {
  user?: UserType;
  org?: OrgType;
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
  apiKeys?: Array<ApiKeyType & { lastUsedAt: Date | null }>;
  connections?: Array<ConnectionType>;
  usage?: {
    dailyEvents: number;
    monthlyEvents: number;
    isUnlimited: boolean;
    limit: number;
    period: 'day' | 'month';
    webhookCount: number;
  };
  webhookAuthorization?: {
    isAuthorized: boolean;
    webhookId: string | null;
    hasPendingRequest: boolean;
  };
  config?: {
    dashboardUrl: string;
    apiUrl: string;
    isSelfHosted: boolean;
    isDevelopment: boolean;
  };
  orgMembers?: Array<OrgMembersType>;
  polling?: PollingState;
}

export class DevInfoService implements vscode.Disposable {
  private configProvider: ConfigProvider | null = null;
  private authStore: AuthStore | null = null;
  private pollingService: PollingService | null = null;
  private authorizationService: WebhookAuthorizationService;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    log('DevInfoService initialized');
    this.authorizationService = WebhookAuthorizationService.getInstance();
  }

  public setConfigProvider(provider: ConfigProvider) {
    this.configProvider = provider;
  }

  public setAuthStore(authStore: AuthStore) {
    this.authStore = authStore;

    // Listen for auth state changes
    const authDisposable = authStore.onDidChangeAuth(() => {
      this.handleAuthStateChange();
    });
    this.disposables.push(authDisposable);

    // Initial fetch if user is signed in
    if (ConfigManager.getInstance().isDevelopment()) {
      this.fetchDevInfo();
    }
  }

  private async handleAuthStateChange(): Promise<void> {
    if (ConfigManager.getInstance().isDevelopment()) {
      this.fetchDevInfo();
      // Try to connect polling service after a short delay to ensure it's initialized
      setTimeout(() => {
        this.connectPollingService();
      }, 1000);
    }
  }

  private connectPollingService(): void {
    if (this.pollingService) {
      // This method will be called when we have access to the polling service
      // The actual connection logic is handled by the polling service itself
      log(
        'DevInfoService: Polling service connection handled by PollingService',
      );
    }
  }

  public setPollingService(pollingService: PollingService) {
    this.pollingService = pollingService;
    // Refresh dev info when polling state changes
    if (ConfigManager.getInstance().isDevelopment()) {
      this.fetchDevInfo();
    }
  }

  public async fetchDevInfo(): Promise<void> {
    if (
      !ConfigManager.getInstance().isDevelopment() ||
      !this.configProvider ||
      !this.authStore
    ) {
      return;
    }

    if (!this.authStore.isSignedIn) {
      log('User not signed in, skipping dev info fetch');
      return;
    }

    try {
      const devInfo: DevInfo = await this.fetchRealDevInfo();

      this.configProvider.setDevInfo(devInfo);
    } catch (error) {
      log('Error fetching development information:', error);
      // Fall back to mock data if API fails
      // const mockDevInfo = await this.fetchMockDevInfo();
      // this.configProvider.setDevInfo(mockDevInfo);
    }
  }

  private async fetchRealDevInfo(): Promise<DevInfo> {
    if (!this.authStore?.api) {
      throw new Error('API client not available');
    }

    const api = this.authStore.api;

    // Get webhook ID from config
    const configManager = ConfigManager.getInstance();
    const webhookId = configManager.getConfig()?.webhookId;

    // Fetch all data in parallel
    const [
      userInfo,
      orgInfo,
      subscriptionStatus,
      apiKeys,
      connections,
      monthlyUsageStats,
      dailyUsage,
      webhookUsage,
      authorizedWebhooks,
      orgMembers,
    ] = await Promise.allSettled([
      // Get user info from session verification
      api.user.current.query(),
      api.org.current.query(),
      // Get subscription status
      api.billing.getSubscriptionStatus.query(),
      // Get API keys with last usage
      api.apiKeys.allWithLastUsage.query(),
      // Get connections
      api.connections.all.query(),
      // Get usage statistics for the current billing period
      api.events.usage.query({ period: 'month' }),
      // Get daily usage statistics
      api.events.usage.query({ period: 'day' }),
      // Get webhook usage statistics
      api.webhooks.usage.query(),
      // Get authorized webhooks
      webhookId
        ? api.webhooks.authorized.query({ id: webhookId })
        : Promise.resolve(false),
      // Get org members
      api.orgMembers.all.query(),
    ]);

    const devInfo: DevInfo = {};

    // Set user info
    if (userInfo.status === 'fulfilled') {
      devInfo.user = userInfo.value;
    }

    if (orgInfo.status === 'fulfilled') {
      devInfo.org = orgInfo.value;
    }

    // Set subscription info
    if (subscriptionStatus.status === 'fulfilled') {
      devInfo.subscription = subscriptionStatus.value;
    }

    // Set API keys
    if (apiKeys.status === 'fulfilled') {
      devInfo.apiKeys = apiKeys.value.map((key) => ({
        ...key,
        lastUsedAt: key.lastUsedAt || null,
      }));
    }

    // Set connections
    if (connections.status === 'fulfilled') {
      devInfo.connections = connections.value.map((conn) => ({
        ...conn,
        connectedAt: conn.connectedAt || null,
        disconnectedAt: conn.disconnectedAt || null,
      }));
    }

    // Calculate usage metrics
    if (monthlyUsageStats.status === 'fulfilled' && monthlyUsageStats.value) {
      const monthlyEvents = monthlyUsageStats.value;
      const webhookCount =
        webhookUsage.status === 'fulfilled' ? (webhookUsage.value ?? 0) : 0;

      const isUnlimited = devInfo.subscription?.isPaid || false;
      const limit = isUnlimited ? -1 : 50; // 50 events per month for free plan
      const period = isUnlimited ? ('month' as const) : ('month' as const);

      devInfo.usage = {
        dailyEvents:
          dailyUsage.status === 'fulfilled' ? (dailyUsage.value ?? 0) : 0,
        isUnlimited,
        limit,
        monthlyEvents,
        period,
        webhookCount,
      };
    }

    // Set webhook authorization info
    if (webhookId) {
      const isAuthorized =
        authorizedWebhooks.status === 'fulfilled'
          ? authorizedWebhooks.value
          : false;
      const authState = this.authorizationService?.getState();

      devInfo.webhookAuthorization = {
        hasPendingRequest: authState?.hasPendingRequest ?? false,
        isAuthorized,
        webhookId,
      };
    }

    // Set config info
    devInfo.config = {
      apiUrl: configManager.getApiUrl(),
      dashboardUrl: configManager.getDashboardUrl(),
      isDevelopment: configManager.isDevelopment(),
      isSelfHosted: configManager.isSelfHosted(),
    };

    // Add org members
    if (orgMembers.status === 'fulfilled') {
      devInfo.orgMembers = orgMembers.value;
    }

    // Add polling connection status
    if (this.pollingService) {
      const pollingState = this.pollingService.getState();
      devInfo.polling = pollingState;
    }

    return devInfo;
  }

  public async refresh(): Promise<void> {
    await this.fetchDevInfo();
  }

  public dispose(): void {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
  }
}
