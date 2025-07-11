import { lookup } from 'node:dns/promises';
import { networkInterfaces } from 'node:os';
import { debug } from '@unhook/logger';

const log = debug('unhook:lib:network-monitor');

export type NetworkStatus = 'online' | 'offline' | 'checking';
export type NetworkStatusCallback = (status: NetworkStatus) => void;

export class NetworkMonitor {
  private status: NetworkStatus = 'checking';
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<NetworkStatusCallback> = new Set();
  private checkInterval: number;
  private host: string;

  constructor(options?: { checkInterval?: number; host?: string }) {
    this.checkInterval = options?.checkInterval ?? 5000; // Default 5 seconds
    this.host = options?.host ?? 'unhook.sh'; // Default to our domain
  }

  private async checkConnection(): Promise<boolean> {
    try {
      // First check if we have any active network interfaces
      const interfaces = networkInterfaces();
      const hasActiveInterface = Object.values(interfaces).some((iface) =>
        iface?.some((addr) => !addr.internal),
      );

      if (!hasActiveInterface) {
        log('No active network interfaces found');
        return false;
      }

      // Then try to resolve our host
      await lookup(this.host);
      return true;
    } catch (error) {
      log('Network check failed:', error);
      return false;
    }
  }

  private async updateStatus(): Promise<void> {
    const previousStatus = this.status;
    this.status = 'checking';

    const isOnline = await this.checkConnection();
    this.status = isOnline ? 'online' : 'offline';

    if (this.status !== previousStatus) {
      log('Network status changed:', {
        current: this.status,
        previous: previousStatus,
      });
      this.notifyCallbacks();
    }
  }

  private notifyCallbacks(): void {
    for (const callback of this.callbacks) {
      try {
        callback(this.status);
      } catch (error) {
        log('Error in network status callback:', error);
      }
    }
  }

  public start(): void {
    if (this.intervalId) return;

    // Do an initial check
    void this.updateStatus();

    // Start periodic checks
    this.intervalId = setInterval(() => {
      void this.updateStatus();
    }, this.checkInterval);

    log('Network monitoring started');
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      log('Network monitoring stopped');
    }
  }

  public getCurrentStatus(): NetworkStatus {
    return this.status;
  }

  public onStatusChange(callback: NetworkStatusCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }
}

// Create a singleton instance
// export const networkMonitor = new NetworkMonitor();
