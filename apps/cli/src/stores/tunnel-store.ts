import { db } from '@unhook/db/client';
import { Tunnels } from '@unhook/db/schema';
import type { TunnelType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { and, desc, eq } from 'drizzle-orm';
import { createStore } from 'zustand';
import { useAuthStore } from './auth-store';
import { useCliStore } from './cli-store';

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
  deleteTunnel: (id: string) => Promise<void>;
  updateTunnel: (id: string, data: Partial<TunnelType>) => Promise<void>;
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

    log('fetchTunnelById', { id, orgId });
    if (!orgId) {
      throw new Error('User must be authenticated to fetch a tunnel');
    }

    const tunnel = await db.query.Tunnels.findFirst({
      where: and(eq(Tunnels.id, id), eq(Tunnels.orgId, orgId)),
      orderBy: [desc(Tunnels.createdAt)],
    });

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
    const tunnels = await db.query.Tunnels.findMany({
      orderBy: [desc(Tunnels.createdAt)],
    });

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
    const { isAuthenticated, isTokenValid } = useAuthStore.getState();
    const { selectedTunnelId } = get();

    log('checkTunnelAuth called', {
      isAuthenticated,
      isTokenValid,
      selectedTunnelId,
    });

    if (
      !isAuthenticated ||
      !isTokenValid ||
      !selectedTunnelId ||
      selectedTunnelId === ''
    ) {
      log('checkTunnelAuth - missing required state', {
        isAuthenticated,
        isTokenValid,
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
    const { clientId } = useCliStore.getState();

    if (!user?.id || !orgId) {
      throw new Error('User must be authenticated to create a tunnel');
    }

    await db.insert(Tunnels).values({
      clientId: clientId || 'default',
      port,
      userId: user.id,
      orgId: orgId ?? 'FIXME',
      requestCount: 0,
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
  deleteTunnel: async (id: string) => {
    await db.delete(Tunnels).where(eq(Tunnels.id, id));
    await get().fetchTunnels();
  },
  updateTunnel: async (id: string, data: Partial<TunnelType>) => {
    await db.update(Tunnels).set(data).where(eq(Tunnels.id, id));
    await get().fetchTunnels();
  },
}));

export const useTunnelStore = createSelectors(store);
