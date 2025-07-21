import { debug } from '@unhook/logger';
import type { ConfigProvider } from '../providers/config.provider';
import type { AuthStore } from './auth.service';

const log = debug('unhook:vscode:dev-info-service');

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

export class DevInfoService {
  private configProvider: ConfigProvider | null = null;
  private authStore: AuthStore | null = null;
  private isDevelopmentMode = false;

  constructor() {
    this.isDevelopmentMode = process.env.NODE_ENV === 'development';
    log('DevInfoService initialized', {
      isDevelopmentMode: this.isDevelopmentMode,
    });
  }

  public setConfigProvider(provider: ConfigProvider) {
    this.configProvider = provider;
  }

  public setAuthStore(authStore: AuthStore) {
    this.authStore = authStore;
  }

  public async fetchDevInfo(): Promise<void> {
    if (!this.isDevelopmentMode || !this.configProvider || !this.authStore) {
      return;
    }

    if (!this.authStore.isSignedIn) {
      log('User not signed in, skipping dev info fetch');
      return;
    }

    try {
      log('Fetching development information from API');

      const devInfo: DevInfo = await this.fetchRealDevInfo();

      this.configProvider.setDevInfo(devInfo);
      log('Development information updated');
    } catch (error) {
      log('Error fetching development information:', error);
      // Fall back to mock data if API fails
      const mockDevInfo = await this.fetchMockDevInfo();
      this.configProvider.setDevInfo(mockDevInfo);
    }
  }

  private async fetchRealDevInfo(): Promise<DevInfo> {
    if (!this.authStore?.api) {
      throw new Error('API client not available');
    }

    const api = this.authStore.api;

    // Fetch all data in parallel
    const [userInfo, subscriptionStatus, apiKeys, connections, usageStats] =
      await Promise.allSettled([
        // Get user info from session verification
        api.auth.verifySessionToken.query({
          sessionId: this.authStore.sessionId || '',
        }),
        // Get subscription status
        api.billing.getSubscriptionStatus.query(),
        // Get API keys with last usage
        api.apiKeys.allWithLastUsage.query(),
        // Get connections
        api.connections.all.query(),
        // Get usage statistics for the last 30 days
        api.apiKeyUsage.stats.query({ days: 30, type: 'webhook-event' }),
      ]);

    const devInfo: DevInfo = {};

    // Set user info
    if (userInfo.status === 'fulfilled') {
      const apiUser = userInfo.value.user;
      devInfo.user = {
        email: apiUser.email || 'unknown@example.com',
        firstName: apiUser.fullName?.split(' ')[0] || undefined, // Provide fallback for undefined email
        id: apiUser.id,
        lastName: apiUser.fullName?.split(' ').slice(1).join(' ') || undefined,
      };
      devInfo.org = { id: userInfo.value.orgId, name: 'Unknown' }; // Org name not in response
    }

    // Set subscription info
    if (subscriptionStatus.status === 'fulfilled') {
      devInfo.subscription = subscriptionStatus.value;
    }

    // Set API keys
    if (apiKeys.status === 'fulfilled') {
      devInfo.apiKeys = apiKeys.value.map((key) => ({
        id: key.id,
        isActive: key.isActive,
        key: key.key,
        lastUsedAt: key.lastUsedAt?.toISOString(),
        name: key.name,
      }));
    }

    // Set connections
    if (connections.status === 'fulfilled') {
      devInfo.connections = connections.value.map((conn) => ({
        clientHostname: conn.clientHostname || undefined,
        clientId: conn.clientId,
        clientOs: conn.clientOs || undefined,
        clientVersion: conn.clientVersion || undefined,
        connectedAt: conn.connectedAt.toISOString(),
        id: conn.id,
        isConnected: !conn.disconnectedAt, // Connection is active if not disconnected
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

    return devInfo;
  }

  private async fetchMockDevInfo(): Promise<DevInfo> {
    // Mock data for development - in a real implementation, this would fetch from the API
    return {
      apiKeys: [
        {
          id: 'ak_123456789',
          isActive: true,
          key: 'usk-live-123456789',
          lastUsedAt: new Date().toISOString(),
          name: 'Development API Key',
        },
        {
          id: 'ak_987654321',
          isActive: true,
          key: 'usk-live-987654321',
          lastUsedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          name: 'Production API Key', // 1 day ago
        },
      ],
      connections: [
        {
          clientHostname: 'dev-machine.local',
          clientId: 'cli_123456789',
          clientOs: 'macOS',
          clientVersion: '0.2.14',
          connectedAt: new Date().toISOString(),
          id: 'c_123456789',
          isConnected: true,
        },
        {
          clientHostname: 'prod-server.company.com',
          clientId: 'cli_987654321',
          clientOs: 'Linux',
          clientVersion: '0.2.13',
          connectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          id: 'c_987654321', // 2 hours ago
          isConnected: false,
        },
      ],
      org: {
        id: 'org_987654321',
        name: 'Acme Corp',
      },
      subscription: {
        customerId: 'cus_123456789',
        isActive: true,
        isCanceled: false,
        isPaid: true,
        isPastDue: false,
        isTrialing: false,
        status: 'active',
        subscriptionId: 'sub_987654321',
      },
      usage: {
        dailyEvents: 15,
        isUnlimited: true,
        limit: -1,
        monthlyEvents: 450,
        period: 'month',
      },
      user: {
        email: 'developer@example.com',
        firstName: 'John',
        id: 'user_123456789',
        lastName: 'Doe',
      },
    };
  }

  public async refresh(): Promise<void> {
    await this.fetchDevInfo();
  }
}
