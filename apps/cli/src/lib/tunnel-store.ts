import { db } from '@acme/db/client';
import { Tunnels } from '@acme/db/schema';
import type { TunnelType } from '@acme/db/schema';
import { createId } from '@acme/id';
import { desc, eq } from 'drizzle-orm';
import { createStore } from 'zustand';
import { useAuthStore } from './auth/store';
import { useConnectionStore } from './connection-store';
import { createSelectors } from './zustand-create-selectors';
import { useCliStore } from './cli-store';

interface TunnelState {
  tunnels: TunnelType[];
  selectedTunnelId: string | null;
  isLoading: boolean;
}

interface TunnelActions {
  setTunnels: (tunnels: TunnelType[]) => void;
  setSelectedTunnelId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  fetchTunnels: () => Promise<void>;
  fetchTunnelByApiKey: (apiKey: string) => Promise<TunnelType | null>;
  createTunnel: (port: number) => Promise<void>;
  deleteTunnel: (id: string) => Promise<void>;
  updateTunnel: (id: string, data: Partial<TunnelType>) => Promise<void>;
}

type TunnelStore = TunnelState & TunnelActions;

const defaultTunnelState: TunnelState = {
  tunnels: [],
  selectedTunnelId: null,
  isLoading: true,
};

const store = createStore<TunnelStore>()((set, get) => ({
  ...defaultTunnelState,
  setTunnels: (tunnels) => set({ tunnels }),
  setSelectedTunnelId: (id) => set({ selectedTunnelId: id }),
  setIsLoading: (isLoading) => set({ isLoading }),
  fetchTunnelByApiKey: async (apiKey: string) => {
    const tunnel = await db.query.Tunnels.findFirst({
      where: eq(Tunnels.apiKey, apiKey),
      orderBy: [desc(Tunnels.createdAt)],
    });

    if (tunnel) {
      set((state) => ({
        tunnels: [tunnel],
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
  createTunnel: async (port: number) => {
    const { userId, orgId } = useAuthStore.getState();
    const { connectionId } = useConnectionStore.getState();
    const { apiKey, clientId } = useCliStore.getState();

    if (!userId || !apiKey || !clientId) {
      throw new Error('User must be authenticated to create a tunnel');
    }

    await db.insert(Tunnels).values({
      clientId,
      apiKey,
      port,
      userId,
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
