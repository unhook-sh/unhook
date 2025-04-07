import net from 'node:net';
import { hostname, platform, release } from 'node:os';
import { db } from '@acme/db/client';
import { Connections } from '@acme/db/schema';
import { createStore } from 'zustand';
import { getProcessIdForPort } from '../utils/get-process-id';
import { useAuthStore } from './auth';
import { useCliStore } from './cli-store';
import { useTunnelStore } from './tunnel-store';
import { createSelectors } from './zustand-create-selectors';

interface ConnectionState {
  isLoading: boolean;
  isConnected: boolean;
  pid: number | null;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  connectionId: string | null;
}

interface ConnectionActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setConnectionState: (state: {
    isConnected: boolean;
    pid: number | null;
    connectionId: string | null;
  }) => Promise<void>;
}

type ConnectionStore = ConnectionState & ConnectionActions;

const defaultConnectionState: ConnectionState = {
  isLoading: false,
  isConnected: false,
  pid: null,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  connectionId: null,
};

const createConnectionStore = () => {
  let socketRef: net.Socket | null = null;
  let reconnectTimeoutRef: NodeJS.Timeout | undefined;
  let isDestroyedRef = false;

  return createStore<ConnectionStore>()((set, get) => ({
    ...defaultConnectionState,

    setConnectionState: async ({ isConnected, pid, connectionId }) => {
      const currentState = get();
      const now = new Date();
      const lastConnectedAt = isConnected ? now : currentState.lastConnectedAt;
      const lastDisconnectedAt = !isConnected
        ? now
        : currentState.lastDisconnectedAt;

      set({
        isConnected,
        pid,
        lastConnectedAt,
        lastDisconnectedAt,
        connectionId,
        isLoading: false,
      });
    },

    connect: async () => {
      const { userId, orgId } = useAuthStore.getState();
      const { clientId, version, port } = useCliStore.getState();
      const { selectedTunnelId } = useTunnelStore.getState();

      if (!userId) {
        throw new Error('User must be authenticated to connect');
      }

      if (!selectedTunnelId) {
        throw new Error('No tunnel selected');
      }

      set({ isLoading: true });

      // Clean up any existing socket
      if (socketRef) {
        socketRef.destroy();
      }

      socketRef = new net.Socket();

      socketRef.on('connect', async () => {
        if (!isDestroyedRef) {
          const foundPid = await getProcessIdForPort(port);

          // Create a new connection record
          const result = await db
            .insert(Connections)
            .values({
              tunnelId: selectedTunnelId,
              ipAddress: '127.0.0.1',
              clientId,
              clientVersion: version,
              clientOs: `${platform()} ${release()}`,
              clientHostname: hostname(),
              userId,
              orgId: orgId ?? 'org_2vCR1xwHHTLxE5m20AYewlc5y2j',
            })
            .returning();

          if (!result[0]) {
            throw new Error('Failed to create connection');
          }

          // Update local connection state
          await get().setConnectionState({
            connectionId: result[0].id,
            isConnected: true,
            pid: foundPid,
          });

          socketRef?.destroy(); // Close connection after successful check
        }
      });

      socketRef.on('error', async () => {
        if (!isDestroyedRef) {
          await get().setConnectionState({
            isConnected: false,
            pid: null,
            connectionId: null,
          });
        }
      });

      // Try to connect with a 1 second timeout
      socketRef.setTimeout(1000);
      socketRef.connect(port, 'localhost');

      // Schedule next check
      reconnectTimeoutRef = setTimeout(
        get().connect,
        get().isConnected ? 5000 : 1000,
      );
    },

    disconnect: async () => {
      isDestroyedRef = true;
      if (socketRef) {
        socketRef.destroy();
        socketRef = null;
      }
      if (reconnectTimeoutRef) {
        clearTimeout(reconnectTimeoutRef);
        reconnectTimeoutRef = undefined;
      }
      await get().setConnectionState({
        isConnected: false,
        pid: null,
        connectionId: null,
      });
    },
  }));
};

export const useConnectionStore = createSelectors(createConnectionStore());
