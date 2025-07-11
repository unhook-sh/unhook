import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';

const log = debug('unhook:lib:network-store');

export type NetworkStatus = 'online' | 'offline' | 'checking';

interface NetworkState {
  status: NetworkStatus;
  lastChecked: number;
  isNode: boolean;
}

interface NetworkActions {
  setStatus: (status: NetworkStatus) => void;
  checkConnection: () => Promise<void>;
  startMonitoring: (options?: { checkInterval?: number }) => void;
  stopMonitoring: () => void;
}

type NetworkStore = NetworkState & NetworkActions;

// Detect if we're in Node.js environment
const isNode = typeof window === 'undefined';

const store = createStore<NetworkStore>()((set, get) => {
  let intervalId: NodeJS.Timeout | null = null;

  const checkNodeConnection = async (): Promise<boolean> => {
    try {
      const { networkInterfaces } = await import('node:os');
      const { lookup } = await import('node:dns/promises');

      // First check if we have any active network interfaces
      const interfaces = networkInterfaces();
      const hasActiveInterface = Object.values(interfaces).some((iface) =>
        iface?.some((addr) => !addr.internal),
      );

      if (!hasActiveInterface) {
        log('No active network interfaces found');
        return false;
      }

      // Then try to resolve our domain
      await lookup('unhook.sh');
      return true;
    } catch (error) {
      log('Network check failed:', error);
      return false;
    }
  };

  const checkBrowserConnection = async (): Promise<boolean> => {
    return navigator.onLine;
  };

  return {
    checkConnection: async () => {
      const { isNode } = get();
      set({ status: 'checking' });

      const isOnline = await (isNode
        ? checkNodeConnection()
        : checkBrowserConnection());
      set({
        lastChecked: Date.now(),
        status: isOnline ? 'online' : 'offline',
      });
    },
    isNode,
    lastChecked: Date.now(),

    // Actions
    setStatus: (status) => set({ lastChecked: Date.now(), status }),

    startMonitoring: (options = {}) => {
      const { checkConnection } = get();
      const checkInterval = options.checkInterval ?? 5000;

      // Stop any existing monitoring
      if (intervalId) clearInterval(intervalId);

      // Initial check
      void checkConnection();

      if (isNode) {
        // Node.js polling
        intervalId = setInterval(() => {
          void checkConnection();
        }, checkInterval);
      } else {
        // Browser event listeners
        window.addEventListener('online', () =>
          set({ lastChecked: Date.now(), status: 'online' }),
        );
        window.addEventListener('offline', () =>
          set({ lastChecked: Date.now(), status: 'offline' }),
        );
      }

      log('Network monitoring started');
    },
    // Initial state
    status: 'checking',

    stopMonitoring: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      if (!isNode) {
        window.removeEventListener('online', () =>
          set({ lastChecked: Date.now(), status: 'online' }),
        );
        window.removeEventListener('offline', () =>
          set({ lastChecked: Date.now(), status: 'offline' }),
        );
      }

      log('Network monitoring stopped');
    },
  };
});

export const useNetworkStore = createSelectors(store);
