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
import type { RealtimeService } from './realtime.service';

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
  };
  orgMembers?: Array<OrgMembersType>;
  realtime?: {
    isConnected: boolean;
    webhookId: string | null;
    eventsConnected: boolean;
    requestsConnected: boolean;
    subscriptionClaims?: {
      events?: {
        found: boolean;
        claimsRole: string | null;
        isAuthenticated: boolean;
      };
      requests?: {
        found: boolean;
        claimsRole: string | null;
        isAuthenticated: boolean;
      };
    };
  };
}

export class DevInfoService implements vscode.Disposable {
  private configProvider: ConfigProvider | null = null;
  private authStore: AuthStore | null = null;
  private realtimeService: RealtimeService | null = null;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    log('DevInfoService initialized');
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
      // Try to connect realtime service after a short delay to ensure it's initialized
      setTimeout(() => {
        this.connectRealtimeService();
      }, 1000);
    }
  }

  private connectRealtimeService(): void {
    if (this.realtimeService) {
      // This method will be called when we have access to the realtime service
      // The actual connection logic is handled by the realtime service itself
      log(
        'DevInfoService: Realtime service connection handled by RealtimeService',
      );
    }
  }

  public setRealtimeService(realtimeService: RealtimeService) {
    this.realtimeService = realtimeService;
    // Refresh dev info when realtime connection state changes
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

    // Fetch all data in parallel
    const [
      userInfo,
      orgInfo,
      subscriptionStatus,
      apiKeys,
      connections,
      usageStats,
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
      // Get usage statistics for the last 30 days
      api.apiKeyUsage.stats.query({ days: 30, type: 'webhook-event' }),
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
    if (usageStats.status === 'fulfilled') {
      const totalEvents = usageStats.value.reduce((sum, stat) => {
        if (stat.type === 'webhook-event') {
          return sum + stat.count;
        }
        return sum;
      }, 0);

      // Get daily events (last 1 day)
      const dailyStats = await api.apiKeyUsage.stats.query({
        days: 1,
        type: 'webhook-event',
      });
      const dailyEvents = dailyStats.reduce((sum, stat) => {
        if (stat.type === 'webhook-event') {
          return sum + stat.count;
        }
        return sum;
      }, 0);

      const isUnlimited = devInfo.subscription?.isPaid || false;
      const limit = isUnlimited ? -1 : 50; // 50 events per day for free plan
      const period = isUnlimited ? ('month' as const) : ('day' as const);

      devInfo.usage = {
        dailyEvents,
        isUnlimited,
        limit,
        monthlyEvents: totalEvents,
        period,
      };
    }

    // Add org members
    if (orgMembers.status === 'fulfilled') {
      devInfo.orgMembers = orgMembers.value;
    }

    // Add realtime connection status
    if (this.realtimeService) {
      const connectionState = this.realtimeService.getConnectionState();
      devInfo.realtime = connectionState;

      // Fetch subscription claims information if we have a webhook ID
      const webhookId =
        connectionState.webhookId ||
        this.configProvider?.getConfig()?.webhookId;

      if (webhookId) {
        try {
          log('Fetching subscription claims for webhook', {
            fromConfig:
              !connectionState.webhookId &&
              !!this.configProvider?.getConfig()?.webhookId,
            fromRealtime: !!connectionState.webhookId,
            webhookId,
          });

          const [eventsClaims, requestsClaims] = await Promise.allSettled([
            api.realtimeSubscriptions.verifyWebhookSubscriptionClaims.query({
              tableName: 'events',
              webhookId,
            }),
            api.realtimeSubscriptions.verifyWebhookSubscriptionClaims.query({
              tableName: 'requests',
              webhookId,
            }),
          ]);

          devInfo.realtime.subscriptionClaims = {};

          if (eventsClaims.status === 'fulfilled') {
            devInfo.realtime.subscriptionClaims.events = eventsClaims.value;
            log('Events claims result', eventsClaims.value);
          } else {
            log('Events claims failed', eventsClaims.reason);
          }

          if (requestsClaims.status === 'fulfilled') {
            devInfo.realtime.subscriptionClaims.requests = requestsClaims.value;
            log('Requests claims result', requestsClaims.value);
          } else {
            log('Requests claims failed', requestsClaims.reason);
          }
        } catch (error) {
          log('Error fetching subscription claims information:', error);
        }
      } else {
        log('No webhook ID available for subscription claims check');
      }
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
