import net from 'node:net';
import { hostname, platform, release } from 'node:os';
import { db } from '@unhook/db/client';
import { Connections } from '@unhook/db/schema';
import { Tunnels } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { eq } from 'drizzle-orm';
import { createStore } from 'zustand';
import { capture } from '../lib/posthog';
import { getProcessIdForPort } from '../utils/get-process-id';
import { useAuthStore } from './auth-store';
import { useCliStore } from './cli-store';
import { useTunnelStore } from './tunnel-store';

const log = debug('unhook:cli:connection-store');

interface ConnectionState {
  isLoading: boolean;
  isConnected: boolean;
  pid: number | null; // PID is only relevant for local port connections
  processName: string | null; // Name of the process if available
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  connectionId: string | null;
}

interface ConnectionActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setConnectionState: (
    state: Partial<ConnectionState> & { isConnected: boolean },
  ) => Promise<void>;
}

type ConnectionStore = ConnectionState & ConnectionActions;

const defaultConnectionState: ConnectionState = {
  isLoading: false,
  isConnected: false,
  pid: null,
  processName: null,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  connectionId: null,
};

const createConnectionStore = () => {
  let socketRef: net.Socket | null = null;
  let reconnectTimeoutRef: NodeJS.Timeout | undefined;
  let isDestroyedRef = false;
  let currentFetchAbortController: AbortController | null = null;

  return createStore<ConnectionStore>()((set, get) => ({
    ...defaultConnectionState,

    setConnectionState: async ({
      isConnected,
      pid,
      processName,
      connectionId,
      ...rest
    }) => {
      const currentState = get();
      const now = new Date();
      const lastConnectedAt = isConnected ? now : currentState.lastConnectedAt;
      const lastDisconnectedAt = !isConnected
        ? now
        : currentState.lastDisconnectedAt;

      capture({
        event: isConnected ? 'connection_established' : 'connection_lost',
        properties: {
          pid,
          processName,
          connectionId,
          lastConnectedAt: lastConnectedAt?.toISOString(),
          lastDisconnectedAt: lastDisconnectedAt?.toISOString(),
        },
      });

      // Update local state
      set({
        ...currentState,
        ...rest,
        isConnected,
        pid: pid ?? currentState.pid,
        processName: processName ?? currentState.processName,
        lastConnectedAt,
        lastDisconnectedAt,
        isLoading: false,
      });

      // Update tunnel record with connection status and process info
      const { selectedTunnelId } = useTunnelStore.getState();
      if (selectedTunnelId) {
        await db
          .update(Tunnels)
          .set({
            localConnectionStatus: isConnected ? 'connected' : 'disconnected',
            localConnectionPid: pid ?? null,
            localConnectionProcessName: processName ?? null,
            lastLocalConnectionAt: isConnected ? now : undefined,
            lastLocalDisconnectionAt: !isConnected ? now : undefined,
          })
          .where(eq(Tunnels.id, selectedTunnelId));
      }
    },

    connect: async () => {
      if (isDestroyedRef) return;

      const {
        ping,
        port: cliPort,
        redirect: cliRedirect,
      } = useCliStore.getState();
      const pingEnabled = ping !== false;
      const pingIsUrl = typeof ping === 'string';
      const pingIsPort = typeof ping === 'number';
      const { user, orgId } = useAuthStore.getState();

      capture({
        event: 'connection_attempt',
        properties: {
          pingEnabled,
          pingIsUrl,
          pingIsPort,
          targetUrl: pingIsUrl ? ping : cliRedirect,
          targetPort: pingIsPort ? ping : cliPort,
        },
      });

      if (!pingEnabled) {
        log('Connection polling (ping) is disabled.');
        // Ensure state reflects disconnected if polling is off
        if (get().isConnected) {
          await get().setConnectionState({ isConnected: false, pid: null });
        }
        return; // Do not attempt connection or schedule reconnect
      }

      const { clientId, version } = useCliStore.getState();
      const { selectedTunnelId } = useTunnelStore.getState();

      if (!user?.id) {
        log('User must be authenticated to connect');
        // Optionally schedule a retry or stop
        return;
      }

      if (!selectedTunnelId) {
        log('No tunnel selected');
        // Optionally schedule a retry or stop
        return;
      }

      set({ isLoading: true });

      // Abort any ongoing fetch request
      currentFetchAbortController?.abort();
      currentFetchAbortController = new AbortController();
      const { signal } = currentFetchAbortController;

      // --- Create DB Connection Record --- (Common logic)
      let dbConnectionId: string | null = null;
      try {
        log('Attempting to create a database connection record');
        const result = await db
          .insert(Connections)
          .values({
            tunnelId: selectedTunnelId,
            ipAddress: 'unknown', // IP address might not be relevant/known
            clientId,
            clientVersion: version,
            clientOs: `${platform()} ${release()}`,
            clientHostname: hostname(),
            userId: user.id,
            orgId: orgId ?? 'org_2vCR1xwHHTLxE5m20AYewlc5y2j', // Consider making this required or handling null
          })
          .returning();

        if (!result[0]?.id) {
          throw new Error('Failed to create connection record in DB');
        }
        log('Database connection record created with ID:', result[0].id);
        dbConnectionId = result[0].id;
      } catch (dbError) {
        log('Error creating connection record:', dbError);
        // Decide how to handle DB connection failure - maybe still try to connect?
        // For now, we'll update state as disconnected and schedule a retry.
        await get().setConnectionState({
          isConnected: false,
          pid: null,
          connectionId: null,
          isLoading: false,
        });
        // Only schedule retry if polling is enabled
        if (pingEnabled) {
          reconnectTimeoutRef = setTimeout(get().connect, 5000); // Retry after 5s
        }
        return;
      }
      // --- End Create DB Connection Record ---

      // Determine the target based on precedence: ping config > CLI args
      let targetUrl: string | null = null;
      let targetPort: number | null = null;

      if (pingIsUrl) {
        targetUrl = ping; // Ping config URL takes highest precedence
      } else if (pingIsPort) {
        targetPort = ping; // Ping config port takes next precedence
      } else if (cliRedirect) {
        targetUrl = cliRedirect; // CLI redirect URL
      } else if (cliPort !== undefined) {
        targetPort = cliPort; // CLI port
      } else {
        // Should not happen due to validation, but handle defensively
        log('Error: No valid target (URL or Port) found for connection check.');
        await get().setConnectionState({
          isConnected: false,
          pid: null,
          connectionId: dbConnectionId,
          isLoading: false,
        });
        // Schedule retry if ping is enabled (might be a temporary config issue)
        reconnectTimeoutRef = setTimeout(get().connect, 5000);
        return;
      }

      // --- Perform Check --- //
      if (targetUrl) {
        // --- Redirect/URL Check --- //
        try {
          // Clean up any old socket if switching from port to redirect
          if (socketRef) {
            socketRef.destroy();
            socketRef = null;
          }

          const response = await fetch(targetUrl, { method: 'HEAD', signal });

          if (!isDestroyedRef) {
            if (response.ok) {
              // Successful HEAD request
              await get().setConnectionState({
                isConnected: true,
                pid: null, // PID not applicable for URL
                connectionId: dbConnectionId, // Ensure connectionId is set
              });
            } else {
              // Non-OK response
              log(
                `Ping URL check failed: ${response.status} ${response.statusText} (${targetUrl})`,
              );
              await get().setConnectionState({
                isConnected: false,
                pid: null,
                connectionId: dbConnectionId, // Ensure connectionId is set
              });
            }
          }
        } catch (error) {
          if (!isDestroyedRef) {
            if ((error as Error).name !== 'AbortError') {
              log(`Error checking ping URL (${targetUrl}):`, error);
            }
            await get().setConnectionState({
              isConnected: false,
              pid: null,
              connectionId: dbConnectionId,
            });
          }
        }
        // --- End Redirect/URL Check --- //
      } else if (targetPort !== null) {
        // --- Local Port Check --- //
        if (socketRef) {
          socketRef.destroy();
        }
        socketRef = new net.Socket();

        socketRef.once('connect', async () => {
          if (!isDestroyedRef) {
            const processInfo = await getProcessIdForPort(targetPort);
            await get().setConnectionState({
              isConnected: true,
              pid: processInfo?.pid ?? null,
              processName: processInfo?.name ?? null,
              connectionId: dbConnectionId,
            });
            socketRef?.destroy(); // Close connection after successful check
          }
        });

        socketRef.once('error', async (err) => {
          if (!isDestroyedRef) {
            log('Socket connection error:', err.message);
            await get().setConnectionState({
              isConnected: false,
              pid: null,
              connectionId: dbConnectionId,
            });
          }
        });

        socketRef.once('timeout', async () => {
          if (!isDestroyedRef) {
            log('Socket connection timed out');
            await get().setConnectionState({
              isConnected: false,
              pid: null,
              connectionId: dbConnectionId,
            });
            socketRef?.destroy();
          }
        });

        // Try to connect with a 1 second timeout
        socketRef.setTimeout(1000);
        socketRef.connect(targetPort, 'localhost');
        // --- End Local Port Check --- //
      }
      // --- End Perform Check --- //

      // Schedule next check only if pinging is enabled
      if (!isDestroyedRef && pingEnabled) {
        reconnectTimeoutRef = setTimeout(
          get().connect,
          get().isConnected ? 5000 : 2000, // Check more frequently if disconnected
        );
      }
    },

    disconnect: async () => {
      isDestroyedRef = true;
      currentFetchAbortController?.abort();

      const currentState = get();

      capture({
        event: 'connection_disconnect',
        properties: {
          connectionId: currentState.connectionId,
          wasConnected: currentState.isConnected,
          pid: currentState.pid,
          processName: currentState.processName,
          lastConnectedAt: currentState.lastConnectedAt?.toISOString(),
        },
      });

      // Clear reconnect timer
      if (reconnectTimeoutRef) {
        clearTimeout(reconnectTimeoutRef);
        reconnectTimeoutRef = undefined;
      }

      // Destroy socket connection if it exists
      if (socketRef) {
        socketRef.destroy();
        socketRef = null;
      }

      // Optionally update the DB connection record status to disconnected
      const connectionId = get().connectionId;
      if (connectionId) {
        try {
          // Placeholder for DB update logic
          // await db
          //   .update(Connections)
          //   .set({ lastDisconnectedAt: new Date() })
          //   .where(eq(Connections.id, connectionId));
          log(`Placeholder: Would update DB for connection ${connectionId}`);
        } catch (error) {
          log(
            `Failed to update connection ${connectionId} status in DB on disconnect:`,
            error,
          );
        }
      }

      // Reset the store state to default, marking the disconnect time
      set({ ...defaultConnectionState, lastDisconnectedAt: new Date() });
    },
  }));
};

export const useConnectionStore = createSelectors(createConnectionStore());
