import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { POST } from './route';

// Mock environment variables
vi.mock('@t3-oss/env-nextjs', () => ({
  createEnv: () => ({
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NODE_ENV: 'test',
    POSTGRES_URL: 'postgres://test:test@localhost:5432/test',
  }),
}));

// Mock database client
const mockValues = vi.fn().mockResolvedValue(undefined);
vi.mock('@acme/db/client', () => ({
  db: {
    query: {
      Tunnels: {
        findFirst: vi.fn(),
      },
    },
    insert: () => ({
      values: mockValues,
    }),
  },
}));

describe('Tunnel Route Handler', () => {
  let mockFindFirst: Mock;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Mock console.error to prevent noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mocks
    const { db } = await import('@acme/db/client');
    mockFindFirst = db.query.Tunnels.findFirst as Mock;

    // Default mock responses
    mockFindFirst.mockResolvedValue({
      id: 'tun_123',
      apiKey: 'test-api-key',
      userId: 'user_123',
      orgId: 'org_123',
      status: 'active',
      config: {
        headers: {},
        requests: {
          allowedMethods: ['GET', 'POST'],
          allowedPaths: ['/test/.*'],
          blockedPaths: ['/admin/.*'],
        },
        storage: {
          maxRequestBodySize: 1048576,
          maxResponseBodySize: 1048576,
          storeHeaders: true,
          storeRequestBody: true,
          storeResponseBody: true,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      port: 3000,
      clientId: 'client_123',
      clientCount: 0,
      requestCount: 0,
    });

    vi.doMock('@acme/id', () => ({
      createId: () => 'test-id',
    }));

    vi.doMock('@acme/tunnel', () => ({
      filterHeaders: vi.fn().mockReturnValue({}),
    }));

    // Clear module cache to ensure new mocks are used
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('API Key and Endpoint Authentication', () => {
    it('should return 401 if no API key is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/tunnel');
      const response = await POST(req);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('API key required');
    });

    it('should return 401 if no endpoint is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/tunnel', {
        headers: {
          'x-api-key': 'test-api-key',
        },
      });
      const response = await POST(req);

      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Endpoint required');
    });

    it('should accept API key from query parameter', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/tunnel?key=test-api-key&endpoint=test/123',
        {
          method: 'POST',
        },
      );
      const response = await POST(req);
      expect(response.status).toBe(202);
      expect(await response.text()).toBe('Webhook received');
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
    });

    it('should accept endpoint from query parameter', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/tunnel?endpoint=test/123',
        {
          method: 'POST',
          headers: {
            'x-api-key': 'test-api-key',
          },
        },
      );
      const response = await POST(req);
      expect(response.status).toBe(202);
      expect(await response.text()).toBe('Webhook received');
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
    });

    it('should prioritize header over query parameter for API key', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/tunnel?key=wrong-key&endpoint=test/123',
        {
          method: 'POST',
          headers: {
            'x-api-key': 'test-api-key',
          },
        },
      );
      const response = await POST(req);
      expect(response.status).toBe(202);
      expect(await response.text()).toBe('Webhook received');
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
    });

    it('should prioritize header over query parameter for endpoint', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/tunnel?endpoint=query-endpoint',
        {
          method: 'POST',
          headers: {
            'x-api-key': 'test-api-key',
            'x-endpoint': 'test/header-endpoint',
          },
        },
      );
      const response = await POST(req);
      expect(response.status).toBe(202);
      expect(await response.text()).toBe('Webhook received');
    });
  });

  it('should return 401 if tunnel is not found', async () => {
    mockFindFirst.mockResolvedValueOnce(undefined);

    const req = new NextRequest('http://localhost:3000/api/tunnel', {
      headers: {
        'x-api-key': 'test-api-key',
        'x-endpoint': 'test/123',
      },
    });
    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('Invalid API key');
  });

  it('should return 405 when method is not allowed', async () => {
    const req = new NextRequest('http://localhost:3000/api/tunnel', {
      method: 'DELETE',
      headers: {
        'x-api-key': 'test-api-key',
        'x-endpoint': 'test/123',
      },
    });
    const response = await POST(req);
    expect(response.status).toBe(405);
    expect(await response.text()).toBe('Method not allowed');
  });

  it('should return 403 when path is blocked', async () => {
    const req = new NextRequest('http://localhost:3000/api/tunnel', {
      method: 'POST',
      headers: {
        'x-api-key': 'test-api-key',
        'x-endpoint': 'admin/123',
      },
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
    expect(await response.text()).toBe('Path not allowed');
  });

  it('should return 403 when path is not in allowed paths', async () => {
    const req = new NextRequest('http://localhost:3000/api/tunnel', {
      method: 'POST',
      headers: {
        'x-api-key': 'test-api-key',
        'x-endpoint': 'other/123',
      },
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
    expect(await response.text()).toBe('Path not allowed');
  });

  it('should successfully store webhook request', async () => {
    const req = new NextRequest('http://localhost:3000/api/tunnel', {
      method: 'POST',
      headers: {
        'x-api-key': 'test-api-key',
        'x-endpoint': 'test/123',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ test: 'data' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(202);
    expect(await response.text()).toBe('Webhook received');
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-api-key',
        tunnelId: 'tun_123',
        userId: 'user_123',
        orgId: 'org_123',
        request: expect.objectContaining({
          method: 'POST',
          url: '/test/123',
          contentType: 'application/json',
        }),
      }),
    );
  });

  it('should handle errors gracefully', async () => {
    mockValues.mockRejectedValueOnce(new Error('Database error'));

    const req = new NextRequest('http://localhost:3000/api/tunnel', {
      method: 'POST',
      headers: {
        'x-api-key': 'test-api-key',
        'x-endpoint': 'test/123',
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal server error');
    expect(console.error).toHaveBeenCalledWith(
      'Error storing webhook request:',
      expect.any(Error),
    );
  });
});
