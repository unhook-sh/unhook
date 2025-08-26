import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from 'bun:test';
import http2 from 'node:http2';
import type { WebhookClientOptions } from './index';
import { startWebhookClient } from './index';

interface MockStream {
  // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
  on: Mock<any>;
  // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
  write: Mock<any>;
  // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
  end: Mock<any>;
}

interface MockClient {
  // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
  on: Mock<any>;
  // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
  request: Mock<any>;
  // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
  destroy: Mock<any>;
  // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
  close: Mock<any>;
  destroyed: boolean;
}

// Mock http2
mock.module('node:http2', () => {
  const mockStream: MockStream = {
    end: mock(),
    on: mock(),
    write: mock(),
  };

  const mockClient: MockClient = {
    close: mock(),
    destroy: mock(),
    destroyed: false,
    on: mock(),
    request: mock(() => mockStream),
  };

  return {
    default: {
      connect: mock(() => mockClient),
      constants: {
        HTTP2_HEADER_METHOD: ':method',
        HTTP2_HEADER_PATH: ':path',
        HTTP2_HEADER_STATUS: ':status',
      },
    },
  };
});

// Mock fetch for local requests
const mockFetch = mock() as unknown as typeof fetch & ReturnType<typeof mock>;
global.fetch = mockFetch;

describe('startWebhookClient', () => {
  const options = {
    port: 3000,
    webhookUrl: 'https://unhook.sh/test-org/test-webhook-id',
  } satisfies WebhookClientOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should establish HTTP/2 connection with correct parameters', async () => {
    const stopClient = await startWebhookClient(options);

    expect(http2.connect).toHaveBeenCalledWith('https://webhook.example.com');

    // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    const client = (http2.connect as Mock<any>).mock.results[0]
      ?.value as MockClient;
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('close', expect.any(Function));

    stopClient();
    expect(client.close).toHaveBeenCalled();
  });

  it('should start request stream with correct headers', async () => {
    const stopClient = await startWebhookClient(options);

    // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    const client = (http2.connect as Mock<any>).mock.results[0]
      ?.value as MockClient;
    const connectHandler = client.on.mock.calls.find(
      (call) => call[0] === 'connect',
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    )?.[1] as any;
    if (!connectHandler) throw new Error('Connect handler not found');

    // Simulate connection
    connectHandler();

    expect(client.request).toHaveBeenCalledWith({
      ':method': 'GET',
      ':path': '/api/webhook',
      'x-api-key': 'test-api-key',
      'x-client-id': 'test-client',
    });

    stopClient();
  });

  it('should handle incoming requests and deliver them to local service', async () => {
    const stopClient = await startWebhookClient(options);

    // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    const client = (http2.connect as Mock<any>).mock.results[0]
      ?.value as MockClient;
    const connectHandler = client.on.mock.calls.find(
      (call) => call[0] === 'connect',
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    )?.[1] as any;
    if (!connectHandler) throw new Error('Connect handler not found');

    // Simulate connection
    connectHandler();

    const stream = client.request.mock.results[0]?.value as MockStream;
    const dataHandler = stream.on.mock.calls.find(
      (call) => call[0] === 'data',
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    )?.[1] as any;
    if (!dataHandler) throw new Error('Data handler not found');

    // Mock successful response from local service
    mockFetch.mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(Buffer.from('{"success":true}')),
      headers: new Headers({ 'content-type': 'application/json' }),
      status: 200,
    });

    // Simulate incoming request
    const mockRequest = {
      data: {
        body: Buffer.from('{"test":true}').toString('base64'),
        headers: { 'content-type': 'application/json' },
        id: 'req-123',
        method: 'POST',
        timestamp: Date.now(),
        url: '/api/test',
      },
      type: 'request',
    };

    dataHandler(Buffer.from(`${JSON.stringify(mockRequest)}\n`));

    // Wait for async operations
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          body: expect.any(Buffer),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        }),
      );
    });

    // Verify response was sent back
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        ':method': 'POST',
        ':path': '/api/webhook',
        'content-type': 'application/json',
        'x-api-key': 'test-api-key',
        'x-client-id': 'test-client',
        'x-webhook-action': 'response',
      }),
    );

    stopClient();
  });

  it('should handle errors from local service', async () => {
    const stopClient = await startWebhookClient(options);

    // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    const client = (http2.connect as Mock<any>).mock.results[0]
      ?.value as MockClient;
    const connectHandler = client.on.mock.calls.find(
      (call) => call[0] === 'connect',
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    )?.[1] as any;
    if (!connectHandler) throw new Error('Connect handler not found');

    // Simulate connection
    connectHandler();

    const stream = client.request.mock.results[0]?.value as MockStream;
    const dataHandler = stream.on.mock.calls.find(
      (call) => call[0] === 'data',
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    )?.[1] as any;
    if (!dataHandler) throw new Error('Data handler not found');

    // Mock failed response from local service
    mockFetch.mockRejectedValueOnce(new Error('Local service error'));

    // Simulate incoming request
    const mockRequest = {
      data: {
        headers: {},
        id: 'req-123',
        method: 'GET',
        timestamp: Date.now(),
        url: '/api/test',
      },
      type: 'request',
    };

    dataHandler(Buffer.from(`${JSON.stringify(mockRequest)}\n`));

    // Wait for async operations
    await vi.waitFor(() => {
      expect(client.request).toHaveBeenCalledWith(
        expect.objectContaining({
          ':method': 'POST',
          ':path': '/api/webhook',
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
          'x-client-id': 'test-client',
          'x-webhook-action': 'response',
        }),
      );
    });

    // Verify error response was sent
    const errorStream = client.request.mock.results[1]?.value as MockStream;
    expect(errorStream.write).toHaveBeenCalledWith(
      expect.stringContaining('"status":500'),
    );

    stopClient();
  });

  it('should handle reconnection on connection errors', async () => {
    vi.useFakeTimers();

    const stopClient = await startWebhookClient(options);

    // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    const client = (http2.connect as Mock<any>).mock.results[0]
      ?.value as MockClient;
    const errorHandler = client.on.mock.calls.find(
      (call) => call[0] === 'error',
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    )?.[1] as any;
    if (!errorHandler) throw new Error('Error handler not found');

    // Simulate connection error
    errorHandler(new Error('Connection lost'));

    // Fast-forward past reconnection delay
    vi.advanceTimersByTime(5000);

    expect(http2.connect).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
    stopClient();
  });

  it('should cleanup resources on stop', async () => {
    const stopClient = await startWebhookClient(options);

    // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    const client = (http2.connect as Mock<any>).mock.results[0]
      ?.value as MockClient;
    const stream = client.request.mock.results[0]?.value as MockStream;
    if (!stream) throw new Error('Stream not found');

    stopClient();

    expect(client.close).toHaveBeenCalled();
    expect(stream.end).toHaveBeenCalled();
  });
});
