import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from 'bun:test';
import type { Mock } from 'bun:test';
import net from 'node:net';
import type { UserResource } from '@clerk/types';
import { db } from '@unhook/db/client';
import { Connections } from '@unhook/db/schema';
import { useAuthStore } from '~/stores/auth-store';
import { useCliStore } from '~/stores/cli-store';
import { useConnectionStore } from '~/stores/connection-store';
import { useTunnelStore } from '~/stores/tunnel-store';

// --- Mocks --- //
mock.module('node:net', () => net);
mock.module('node:os', () => ({
  hostname: mock(() => 'test-host'),
  platform: mock(() => 'test-platform'),
  release: mock(() => 'test-release'),
}));
mock.module('@unhook/db/client', () => {
  const returningMock = mock();
  const valuesMock = { returning: returningMock };
  const insertMock = { values: mock(() => valuesMock) };
  return {
    db: {
      insert: mock((_table: unknown) => insertMock),
    },
    sql: { end: mock() },
  };
});
mock.module('../utils/get-process-id', () => ({
  getProcessIdForPort: mock(),
}));
mock.module('./auth', () => useAuthStore);
mock.module('./cli-store', () => useCliStore);
mock.module('./tunnel-store', () => useTunnelStore);

// Mock global fetch
global.fetch = mock() as unknown as typeof fetch;

// --- Test Suite --- //
describe('useConnectionStore', () => {
  let mockDbReturning: Mock<() => Promise<{ id: string }[]>>;
  const mockGetProcessIdForPort = {
    getProcessIdForPort: mock(),
  };
  let mockNetSocket: net.Socket;

  beforeAll(async () => {
    await mock.module('../utils/get-process-id', () => mockGetProcessIdForPort);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useConnectionStore.setState(useConnectionStore.getInitialState(), true);

    mockNetSocket = {
      on: vi.fn(),
      once: vi
        .fn()
        .mockImplementation(
          (
            _event: string,
            _listener: (...args: unknown[]) => void,
          ): net.Socket => {
            return mockNetSocket;
          },
        ),
      setTimeout: vi.fn(),
      connect: vi.fn().mockImplementation((..._args: unknown[]): net.Socket => {
        return mockNetSocket;
      }),
      destroy: vi.fn(),
    } as unknown as net.Socket;
    vi.mocked(net.Socket).mockReturnValue(mockNetSocket);

    // Get the mock with a more specific type
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    mockDbReturning = ((db.insert(Connections) as any).values({}) as any)
      .returning as Mock<() => Promise<{ id: string }[]>>;
    mockDbReturning.mockClear();
    mockDbReturning.mockResolvedValue([{ id: 'new-conn-id' }]);

    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: { id: 'test-user-id' } as UserResource,
      orgId: 'test-org-id',
      isValidatingToken: false,
      validateToken: vi.fn(),
      isTokenValid: true,
      isAuthenticated: true,
      sessionId: 'test-session-id',
      token: 'test-token',
      isLoading: false,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
      setIsLoading: vi.fn(),
    });
    vi.mocked(useCliStore.getState).mockReturnValue({
      port: 3000,
      redirect: undefined,
      tunnelId: 'test-tunnel-id',
      clientId: 'test-client-id',
      debug: false,
      version: '1.0.0',
      ping: false,
      argSources: {},
      telemetry: true,
      setPort: vi.fn(),
      setDebug: vi.fn(),
      setTunnelId: vi.fn(),
      setClientId: vi.fn(),
      setRedirect: vi.fn(),
      setVersion: vi.fn(),
      setPing: vi.fn(),
      setCliArgs: vi.fn(),
      setTelemetry: vi.fn(),
    });
    vi.mocked(useTunnelStore.getState).mockReturnValue({
      selectedTunnelId: 'test-tunnel-id',
      isAuthorizedForTunnel: true,
      isCheckingTunnel: false,
      setIsAuthorizedForTunnel: vi.fn(),
      setIsCheckingTunnel: vi.fn(),
      checkTunnelAuth: vi.fn(),
      tunnels: [],
      isLoading: false,
      fetchTunnelById: vi.fn(),
      setSelectedTunnelId: vi.fn(),
      setTunnels: vi.fn(),
      setIsLoading: vi.fn(),
      fetchTunnels: vi.fn(),
      createTunnel: vi.fn(),
      deleteTunnel: vi.fn(),
      updateTunnel: vi.fn(),
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response);
  });

  afterEach(() => {
    // vi.useRealTimers();
    vi.mocked(mockNetSocket.destroy).mockClear();
    vi.mocked(global.fetch).mockClear();
    mockDbReturning.mockClear();
  });

  it('should initialize with default state', () => {
    const state = useConnectionStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.pid).toBeNull();
    expect(state.connectionId).toBeNull();
    expect(state.lastConnectedAt).toBeNull();
    expect(state.lastDisconnectedAt).toBeNull();
  });

  describe('Port Connection', () => {
    it('should connect successfully to a local port', async () => {
      vi.mocked(mockGetProcessIdForPort.getProcessIdForPort).mockResolvedValue({
        pid: 12345,
        name: 'test-process',
      });
      vi.mocked(mockNetSocket.once).mockImplementation(
        (event: string, listener: () => void) => {
          if (event === 'connect') {
            setTimeout(() => listener(), 50);
          }
          return mockNetSocket;
        },
      );

      const { connect } = useConnectionStore.getState();
      const connectPromise = connect();

      expect(useConnectionStore.getState().isLoading).toBe(true);

      await vi.advanceTimersByTimeAsync(100);
      await connectPromise;

      const state = useConnectionStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.pid).toBe(12345);
      expect(state.connectionId).toBe('new-conn-id');
      expect(state.lastConnectedAt).toBeInstanceOf(Date);
      expect(mockDbReturning).toHaveBeenCalled();
      expect(mockNetSocket.connect).toHaveBeenCalledWith(3000, 'localhost');
      expect(mockNetSocket.destroy).toHaveBeenCalled();
    });

    it('should handle socket connection error', async () => {
      vi.mocked(mockNetSocket.once).mockImplementation(
        (event: string, listener: (err: Error) => void) => {
          if (event === 'error') {
            setTimeout(() => listener(new Error('Connection refused')), 50);
          }
          return mockNetSocket;
        },
      );

      const { connect } = useConnectionStore.getState();
      const connectPromise = connect();

      await vi.advanceTimersByTimeAsync(100);
      await connectPromise;

      const state = useConnectionStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.pid).toBeNull();
      expect(state.connectionId).toBe('new-conn-id');
      expect(state.lastDisconnectedAt).toBeInstanceOf(Date);
    });

    it('should handle socket connection timeout', async () => {
      vi.mocked(mockNetSocket.once).mockImplementation(
        (event: string, listener: () => void) => {
          if (event === 'timeout') {
            setTimeout(() => listener(), 1001);
          }
          return mockNetSocket;
        },
      );
      vi.mocked(mockNetSocket.connect).mockImplementation(
        (..._args: unknown[]) => mockNetSocket,
      );

      const { connect } = useConnectionStore.getState();
      const connectPromise = connect();

      await vi.advanceTimersByTimeAsync(1100);
      await connectPromise;

      const state = useConnectionStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.pid).toBeNull();
      expect(state.connectionId).toBe('new-conn-id');
      expect(state.lastDisconnectedAt).toBeInstanceOf(Date);
      expect(mockNetSocket.destroy).toHaveBeenCalled();
    });
  });

  describe('Redirect Connection', () => {
    beforeEach(() => {
      vi.mocked(useCliStore.getState).mockReturnValue({
        port: undefined,
        redirect: 'https://example.com/redirect',
        tunnelId: 'test-tunnel-id',
        clientId: 'test-client-id',
        debug: false,
        version: '1.0.0',
        ping: false,
        argSources: {},
        telemetry: true,
        setPort: vi.fn(),
        setDebug: vi.fn(),
        setTunnelId: vi.fn(),
        setClientId: vi.fn(),
        setRedirect: vi.fn(),
        setVersion: vi.fn(),
        setPing: vi.fn(),
        setCliArgs: vi.fn(),
        setTelemetry: vi.fn(),
      });
    });

    it('should connect successfully to a redirect URL', async () => {
      const { connect } = useConnectionStore.getState();
      const connectPromise = connect();

      expect(useConnectionStore.getState().isLoading).toBe(true);

      await connectPromise;

      const state = useConnectionStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.pid).toBeNull();
      expect(state.connectionId).toBe('new-conn-id');
      expect(state.lastConnectedAt).toBeInstanceOf(Date);
      expect(mockDbReturning).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith('https://example.com/redirect', {
        method: 'HEAD',
        signal: expect.any(AbortSignal),
      });
      expect(mockNetSocket.connect).not.toHaveBeenCalled();
    });

    it('should handle fetch error for redirect URL', async () => {
      const fetchError = new Error('Network Error');
      vi.mocked(fetch).mockRejectedValue(fetchError);

      const { connect } = useConnectionStore.getState();
      await connect();

      const state = useConnectionStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.pid).toBeNull();
      expect(state.connectionId).toBe('new-conn-id');
      expect(state.lastDisconnectedAt).toBeInstanceOf(Date);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle non-OK fetch response for redirect URL', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const { connect } = useConnectionStore.getState();
      await connect();

      const state = useConnectionStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.pid).toBeNull();
      expect(state.connectionId).toBe('new-conn-id');
      expect(state.lastDisconnectedAt).toBeInstanceOf(Date);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disconnect', () => {
    it('should reset state on disconnect', async () => {
      vi.mocked(mockGetProcessIdForPort.getProcessIdForPort).mockResolvedValue({
        pid: 12345,
        name: 'test-process',
      });
      vi.mocked(mockNetSocket.once).mockImplementation(
        (event: string, listener: () => void) => {
          if (event === 'connect') setTimeout(() => listener(), 50);
          return mockNetSocket;
        },
      );
      const { connect, disconnect } = useConnectionStore.getState();
      await connect();
      await vi.advanceTimersByTimeAsync(100);

      expect(useConnectionStore.getState().isConnected).toBe(true);
      const connectTime = useConnectionStore.getState().lastConnectedAt;

      await disconnect();

      const state = useConnectionStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.pid).toBeNull();
      expect(state.connectionId).toBeNull();
      expect(state.lastConnectedAt).toBeNull();
      expect(state.lastDisconnectedAt).toBeInstanceOf(Date);
      expect(state.lastDisconnectedAt).not.toEqual(connectTime);
      expect(mockNetSocket.destroy).toHaveBeenCalledTimes(2);
    });

    it('should clear reconnect timer on disconnect', async () => {
      const { connect, disconnect } = useConnectionStore.getState();
      await connect();
      await vi.advanceTimersByTimeAsync(100);
      expect(useConnectionStore.getState().isConnected).toBe(true);

      const initialTimers = vi.getTimerCount();
      expect(initialTimers).toBeGreaterThan(0);

      await disconnect();

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should not connect if user is not authenticated', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        orgId: null,
        isAuthenticated: false,
        isTokenValid: false,
        isValidatingToken: false,
        validateToken: vi.fn(),
        sessionId: 'test-session-id',
        token: null,
        isLoading: false,
        setAuth: vi.fn(),
        clearAuth: vi.fn(),
        setIsLoading: vi.fn(),
      });

      const { connect } = useConnectionStore.getState();
      await connect();

      expect(useConnectionStore.getState().isConnected).toBe(false);
      expect(useConnectionStore.getState().isLoading).toBe(false);
      expect(mockDbReturning).not.toHaveBeenCalled();
      expect(mockNetSocket.connect).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should not connect if tunnel is not selected', async () => {
      vi.mocked(useTunnelStore.getState).mockReturnValue({
        checkTunnelAuth: vi.fn(),
        isAuthorizedForTunnel: false,
        isCheckingTunnel: false,
        setIsAuthorizedForTunnel: vi.fn(),
        setIsCheckingTunnel: vi.fn(),
        selectedTunnelId: null,
        tunnels: [],
        isLoading: false,
        fetchTunnelById: vi.fn(),
        setSelectedTunnelId: vi.fn(),
        setTunnels: vi.fn(),
        setIsLoading: vi.fn(),
        fetchTunnels: vi.fn(),
        createTunnel: vi.fn(),
        deleteTunnel: vi.fn(),
        updateTunnel: vi.fn(),
      });

      const { connect } = useConnectionStore.getState();
      await connect();

      expect(useConnectionStore.getState().isConnected).toBe(false);
      expect(useConnectionStore.getState().isLoading).toBe(false);
      expect(mockDbReturning).not.toHaveBeenCalled();
      expect(mockNetSocket.connect).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle DB insert failure', async () => {
      const dbError = new Error('DB connection failed');
      vi.mocked(mockDbReturning).mockRejectedValue(dbError);

      const { connect } = useConnectionStore.getState();
      await connect();

      const state = useConnectionStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.connectionId).toBeNull();
      expect(state.lastDisconnectedAt).toBeInstanceOf(Date);
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });
  });
});
