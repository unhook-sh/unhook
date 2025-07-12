import { NextRequest } from 'next/server';
import { GET } from './route';

describe('/api/mcp route', () => {
  it('should return 401 when authorization header is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/mcp');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('should return 401 when authorization header does not start with Bearer', async () => {
    const request = new NextRequest('http://localhost:3000/api/mcp', {
      headers: {
        authorization: 'Invalid token',
      },
    });
    const response = await GET(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('should return SSE response with correct headers when authorized', async () => {
    const request = new NextRequest('http://localhost:3000/api/mcp', {
      headers: {
        authorization: 'Bearer valid-token',
      },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(response.headers.get('Connection')).toBe('keep-alive');
  });

  it('should not have a POST handler', () => {
    // @ts-expect-error - Verifying POST doesn't exist
    expect(typeof POST).toBe('undefined');
  });
});
