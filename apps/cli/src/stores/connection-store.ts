import net from 'node:net';
import {} from 'node:os';
import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { createStore } from 'zustand';
import { capture } from '../lib/posthog';
import { useApiStore } from './api-store';
import { useAuthStore } from './auth-store';
import { useCliStore } from './cli-store';
import { useConfigStore } from './config-store';
import { useTunnelStore } from './tunnel-store';

const log = debug('unhook:cli:connection-store');

interface RuleConnectionState {
  isConnected: boolean;
  pid: number | null;
  processName: string | null;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
}

interface ConnectionState {
  isLoading: boolean;
  ruleStates: Record<string, RuleConnectionState>;
  connectionId: string | null;
}

interface ConnectionActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setRuleConnectionState: (
    ruleId: string,
    state: Partial<RuleConnectionState>,
  ) => Promise<void>;
  destroy: () => Promise<void>;
  reset: () => void;
}

interface ConnectionComputed {
  isAnyConnected: boolean;
  isAllConnected: boolean;
}

type ConnectionStore = ConnectionState & ConnectionActions & ConnectionComputed;

const defaultRuleState: RuleConnectionState = {
  isConnected: false,
  pid: null,
  processName: null,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
};

const defaultConnectionState: ConnectionState = {
  isLoading: false,
  ruleStates: {},
  connectionId: null,
};

const createConnectionStore = () => {
  let socketRef: net.Socket | null = null;
  let reconnectTimeoutRef: NodeJS.Timeout | undefined;
  let isDestroyedRef = false;
  let currentFetchAbortController: AbortController | null = null;

  return createStore<ConnectionStore>((set, get) => ({
    ...defaultConnectionState,

    // Computed properties
    get isAnyConnected() {
      const ruleStates = get().ruleStates;
      return Object.values(ruleStates).some((state) => state.isConnected);
    },

    get isAllConnected() {
      const ruleStates = get().ruleStates;
      const states = Object.values(ruleStates);
      return states.length > 0 && states.every((state) => state.isConnected);
    },

    setRuleConnectionState: async (
      ruleId: string,
      newState: Partial<RuleConnectionState>,
    ) => {
      const currentState = get();
      const now = new Date();
      const currentRuleState = currentState.ruleStates[ruleId] || {
        ...defaultRuleState,
      };

      const updatedRuleState = {
        ...currentRuleState,
        ...newState,
        lastConnectedAt: newState.isConnected
          ? now
          : currentRuleState.lastConnectedAt,
        lastDisconnectedAt:
          newState.isConnected === false
            ? now
            : currentRuleState.lastDisconnectedAt,
      };

      capture({
        event: updatedRuleState.isConnected
          ? 'rule_connection_established'
          : 'rule_connection_lost',
        properties: {
          ruleId,
          pid: updatedRuleState.pid,
          processName: updatedRuleState.processName,
          connectionId: currentState.connectionId,
          lastConnectedAt: updatedRuleState.lastConnectedAt?.toISOString(),
          lastDisconnectedAt:
            updatedRuleState.lastDisconnectedAt?.toISOString(),
        },
      });

      // Update local state
      set({
        ...currentState,
        ruleStates: {
          ...currentState.ruleStates,
          [ruleId]: updatedRuleState,
        },
        isLoading: false,
      });

      // Update tunnel record with connection status
      const { selectedTunnelId } = useTunnelStore.getState();
      if (selectedTunnelId) {
        const isAnyConnected = Object.values({
          ...currentState.ruleStates,
          [ruleId]: updatedRuleState,
        }).some((state) => state.isConnected);

        const { api } = useApiStore.getState();
        // const tunnel = await api.tunnels.byId.query({ id: selectedTunnelId });
        // if (tunnel) {
        //   await api.tunnels.update.mutate({
        //     id: selectedTunnelId,
        //     clientId: tunnel.clientId,
        //     port: tunnel.port,
        //     localConnectionStatus: isAnyConnected
        //       ? 'connected'
        //       : 'disconnected',
        //     localConnectionPid: updatedRuleState.pid ?? undefined,
        //     localConnectionProcessName:
        //       updatedRuleState.processName ?? undefined,
        //     lastLocalConnectionAt: updatedRuleState.isConnected
        //       ? now
        //       : undefined,
        //     lastLocalDisconnectionAt: !updatedRuleState.isConnected
        //       ? now
        //       : undefined,
        //   });
        // }
      }
    },

    connect: async () => {
      if (isDestroyedRef) return;

      const { forward, to } = useConfigStore.getState();
      const { user, orgId } = useAuthStore.getState();
      const { api } = useApiStore.getState();

      // If no forward rules have ping enabled, treat as disabled
      const pingEnabled = to.some((rule) => rule.ping !== false);

      capture({
        event: 'connection_attempt',
        properties: {
          pingEnabled,
          forwardRulesCount: forward.length,
        },
      });

      if (!pingEnabled) {
        log('Connection polling (ping) is disabled for all forward rules.');
        // Clear all rule states if polling is off
        set((state) => ({
          ...state,
          ruleStates: {},
        }));
        return;
      }

      const { version } = useCliStore.getState();
      const { clientId } = useConfigStore.getState();
      const { selectedTunnelId } = useTunnelStore.getState();

      if (!user?.id) {
        log('User must be authenticated to connect');
        return;
      }

      if (!selectedTunnelId) {
        log('No tunnel selected');
        return;
      }

      if (!orgId) {
        log('No organization selected');
        return;
      }

      set({ isLoading: true });

      // Abort any ongoing fetch request
      currentFetchAbortController?.abort();
      currentFetchAbortController = new AbortController();
      const { signal } = currentFetchAbortController;

      // Create DB Connection Record
      const dbConnectionId: string | null = null;
      try {
        log('Attempting to create a database connection record');
        // const result = await api.connections.create.mutate({
        //   tunnelId: selectedTunnelId,
        //   ipAddress: 'unknown',
        //   clientId: clientId ?? '',
        //   clientVersion: version,
        //   clientOs: `${platform()} ${release()}`,
        //   clientHostname: hostname(),
        //   connectedAt: new Date(),
        //   lastPingAt: new Date(),
        // });

        // if (!result?.id) {
        //   throw new Error('Failed to create connection record in DB');
        // }
        // log('Database connection record created with ID:', result.id);
        // dbConnectionId = result.id;
        set({ connectionId: dbConnectionId });
      } catch (dbError) {
        log('Error creating connection record:', dbError);
        set({ isLoading: false });
        if (pingEnabled) {
          reconnectTimeoutRef = setTimeout(get().connect, 5000);
        }
        return;
      }

      // Check each forward rule that has ping enabled
      for (const rule of to) {
        if (rule.ping === false) continue;

        // Generate a stable ID for the rule based on from/to
        const ruleId = `${String(rule.name)}`;

        // Ensure we have a valid URL string for the target
        const targetUrl =
          typeof rule.url === 'string'
            ? rule.url
            : rule.url instanceof URL
              ? rule.url.toString()
              : `${rule.url.protocol || 'http'}://${rule.url.hostname}${rule.url.port ? `:${rule.url.port}` : ''}${rule.url.pathname || ''}`;

        // Ensure we have a valid URL string for ping
        const pingUrl =
          typeof rule.ping === 'string' || rule.ping instanceof URL
            ? rule.ping.toString()
            : typeof rule.ping === 'object' && rule.ping !== null
              ? `${rule.ping.protocol || 'http'}://${rule.ping.hostname}${rule.ping.port ? `:${rule.ping.port}` : ''}${rule.ping.pathname || ''}`
              : targetUrl;

        // Extract port from URL if it's a localhost URL
        const localhostMatch = pingUrl.match(
          /^https?:\/\/(localhost|127\.0\.0\.1)(?::(\d+))?/,
        );

        if (localhostMatch) {
          const port = Number.parseInt(localhostMatch[2] || '80', 10);

          if (socketRef) {
            socketRef.destroy();
          }
          socketRef = new net.Socket();

          try {
            await new Promise<void>((resolve, reject) => {
              if (!socketRef) {
                reject(new Error('Socket not initialized'));
                return;
              }

              socketRef.once('connect', async () => {
                await get().setRuleConnectionState(ruleId, {
                  isConnected: true,
                });
                resolve();
                if (socketRef) socketRef.destroy();
              });

              socketRef.once('error', (err) => {
                log(`Socket connection error for port ${port}:`, err.message);
                reject(err);
              });

              socketRef.once('timeout', () => {
                log(`Socket connection timed out for port ${port}`);
                reject(new Error('Connection timeout'));
              });

              socketRef.setTimeout(1000);
              socketRef.connect(port, 'localhost');
            });
          } catch (error) {
            log(`Failed to connect to localhost:${port}:`, error);
            await get().setRuleConnectionState(ruleId, {
              isConnected: false,
              pid: null,
              processName: null,
            });
          }
        } else {
          try {
            const response = await fetch(pingUrl, { method: 'HEAD', signal });
            await get().setRuleConnectionState(ruleId, {
              isConnected: response.ok,
              pid: null,
              processName: null,
            });

            if (!response.ok) {
              log(
                `Ping URL check failed: ${response.status} ${response.statusText} (${pingUrl})`,
              );
            }
          } catch (error) {
            if ((error as Error).name !== 'AbortError') {
              log(`Error checking ping URL (${pingUrl}):`, error);
            }
            await get().setRuleConnectionState(ruleId, {
              isConnected: false,
              pid: null,
              processName: null,
            });
          }
        }
      }

      // Schedule next check only if pinging is enabled
      if (!isDestroyedRef && pingEnabled) {
        reconnectTimeoutRef = setTimeout(
          get().connect,
          get().isAnyConnected ? 5000 : 2000, // Check more frequently if disconnected
        );
      }
    },

    disconnect: async () => {
      isDestroyedRef = true;
      currentFetchAbortController?.abort();

      const currentState = get();
      const { api } = useApiStore.getState();

      capture({
        event: 'connection_disconnect',
        properties: {
          connectionId: currentState.connectionId,
          wasAnyConnected: currentState.isAnyConnected,
          wasAllConnected: currentState.isAllConnected,
          ruleStates: currentState.ruleStates,
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

      // Update the DB connection record status to disconnected
      const connectionId = currentState.connectionId;
      if (connectionId) {
        // try {
        // const connection = await api.connections.byId.query({
        //   id: connectionId,
        // });
        // if (connection) {
        //   await api.connections.update.mutate({
        //     id: connectionId,
        //     clientId: connection.clientId,
        //     tunnelId: connection.tunnelId,
        //     ipAddress: connection.ipAddress,
        //     connectedAt: connection.connectedAt,
        //     lastPingAt: connection.lastPingAt,
        //     disconnectedAt: new Date(),
        //   });
        // }
        // } catch (error) {
        // log('Failed to update connection status in DB on disconnect:', error);
        // }
      }

      // Reset the store state to default
      set({
        ...defaultConnectionState,
        ruleStates: Object.fromEntries(
          Object.entries(currentState.ruleStates).map(([ruleId, state]) => [
            ruleId,
            {
              ...state,
              isConnected: false,
              lastDisconnectedAt: new Date(),
            },
          ]),
        ),
      });
    },

    reset: () => {
      // Complete reset of the store to initial state
      set(defaultConnectionState);
    },

    destroy: async () => {
      log('Destroying connection store...');
      isDestroyedRef = true;

      // Clear any pending reconnect timeouts
      if (reconnectTimeoutRef) {
        clearTimeout(reconnectTimeoutRef);
        reconnectTimeoutRef = undefined;
      }

      // Abort any pending fetch requests
      if (currentFetchAbortController) {
        currentFetchAbortController.abort();
        currentFetchAbortController = null;
      }

      // Close any open sockets
      if (socketRef) {
        socketRef.destroy();
        socketRef = null;
      }

      // Reset state
      set(defaultConnectionState);
      log('Connection store destroyed');
    },
  }));
};

export const useConnectionStore = createSelectors(createConnectionStore());
