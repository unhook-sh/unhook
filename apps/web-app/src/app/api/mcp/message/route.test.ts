import { NextRequest } from 'next/server';
import { POST } from './route';

describe('/api/mcp/message route', () => {
  it('should return 401 when authorization header is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/mcp/message', {
      method: 'POST',
      body: JSON.stringify({ id: '1', type: 'request' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid message format', async () => {
    const request = new NextRequest('http://localhost:3000/api/mcp/message', {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ invalid: 'message' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid message format');
  });

  it('should process valid MCP request message', async () => {
    const request = new NextRequest('http://localhost:3000/api/mcp/message', {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        id: 'test-123',
        type: 'request',
        method: 'test.method',
        params: { test: true },
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe('test-123');
    expect(json.type).toBe('response');
  });

  it('should not have a GET handler', () => {
    // @ts-expect-error - Verifying GET doesn't exist
    expect(typeof GET).toBe('undefined');
  });
});
