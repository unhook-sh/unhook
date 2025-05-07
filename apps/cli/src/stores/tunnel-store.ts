import type { TunnelType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';
import { useApiStore } from './api-store';
import { useAuthStore } from './auth-store';
import { useConfigStore } from './config-store';

const log = debug('unhook:cli:tunnel-store');

interface TunnelState {
  tunnels: TunnelType[];
  selectedTunnelId: string | null;
  isLoading: boolean;
  isAuthorizedForTunnel: boolean;
  isCheckingTunnel: boolean;
}

interface TunnelActions {
  setTunnels: (tunnels: TunnelType[]) => void;
  setSelectedTunnelId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAuthorizedForTunnel: (isAuthorized: boolean) => void;
  setIsCheckingTunnel: (isChecking: boolean) => void;
  fetchTunnels: () => Promise<void>;
  fetchTunnelById: (tunnelId: string) => Promise<TunnelType | null>;
  createTunnel: (port: number) => Promise<void>;
  checkTunnelAuth: () => Promise<boolean>;
}

type TunnelStore = TunnelState & TunnelActions;

const defaultTunnelState: TunnelState = {
  tunnels: [],
  selectedTunnelId: null,
  isLoading: true,
  isAuthorizedForTunnel: false,
  isCheckingTunnel: true,
};

const store = createStore<TunnelStore>()((set, get) => ({
  ...defaultTunnelState,
  setTunnels: (tunnels) => set({ tunnels }),
  setSelectedTunnelId: (id) => set({ selectedTunnelId: id }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsAuthorizedForTunnel: (isAuthorized) =>
    set({ isAuthorizedForTunnel: isAuthorized }),
  setIsCheckingTunnel: (isChecking) => set({ isCheckingTunnel: isChecking }),
  fetchTunnelById: async (id: string) => {
    const { orgId } = useAuthStore.getState();
    const { api } = useApiStore.getState();

    log('fetchTunnelById', { id, orgId });

    const tunnel = await api.tunnels.byId.query({ id });

    if (tunnel) {
      set((state) => ({
        tunnels: state.tunnels.some((t) => t.id === tunnel.id)
          ? state.tunnels.map((t) => (t.id === tunnel.id ? tunnel : t))
          : [...state.tunnels, tunnel],
        selectedTunnelId: tunnel.id,
        isLoading: false,
      }));

      return tunnel;
    }

    return null;
  },
  fetchTunnels: async () => {
    const { api } = useApiStore.getState();

    const tunnels = await api.tunnels.all.query();

    set((state) => {
      const selectedTunnelId =
        !state.selectedTunnelId && tunnels.length > 0
          ? (tunnels[0]?.id ?? null)
          : state.selectedTunnelId;

      return {
        tunnels,
        selectedTunnelId,
        isLoading: false,
      };
    });
  },
  checkTunnelAuth: async () => {
    const { isSignedIn } = useAuthStore.getState();
    const { selectedTunnelId } = get();

    log('checkTunnelAuth called', {
      isSignedIn,
      selectedTunnelId,
    });

    if (!isSignedIn || !selectedTunnelId || selectedTunnelId === '') {
      log('checkTunnelAuth - missing required state', {
        isSignedIn,
        selectedTunnelId,
      });
      set({
        isAuthorizedForTunnel: false,
        isCheckingTunnel: false,
      });
      return false;
    }

    try {
      log('checkTunnelAuth - setting isCheckingTunnel to true');
      set({ isCheckingTunnel: true });
      const tunnel = await get().fetchTunnelById(selectedTunnelId);
      const isAuthorized = !!tunnel;
      log('checkTunnelAuth - completed check', {
        isAuthorized,
        tunnel: !!tunnel,
      });
      set({
        isAuthorizedForTunnel: isAuthorized,
        isCheckingTunnel: false,
      });
      return isAuthorized;
    } catch (error) {
      log('checkTunnelAuth - error during check', { error });
      set({
        isAuthorizedForTunnel: false,
        isCheckingTunnel: false,
      });
      return false;
    }
  },
  createTunnel: async (port: number) => {
    const { user, orgId } = useAuthStore.getState();
    const { clientId } = useConfigStore.getState();

    if (!user?.id || !orgId) {
      throw new Error('User must be authenticated to create a tunnel');
    }

    const { api } = useApiStore.getState();

    await api.tunnels.create.mutate({
      clientId: clientId || 'default',
      port,
      clientCount: 0,
      localConnectionStatus: 'disconnected',
      status: 'inactive',
      config: {
        storage: {
          storeHeaders: true,
          storeRequestBody: true,
          storeResponseBody: true,
          maxRequestBodySize: 1024 * 1024, // 1MB
          maxResponseBodySize: 1024 * 1024, // 1MB
        },
        headers: {},
        requests: {},
      },
    });

    await get().fetchTunnels();
  },
}));

export const useTunnelStore = createSelectors(store);
