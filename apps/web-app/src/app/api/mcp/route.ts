import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createTRPCContext } from '@unhook/api';
import { debug } from '@unhook/logger';
import { createUnhookMCPServer } from '@unhook/mcp-server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const log = debug('unhook:api:mcp');

// Store active sessions in memory (in production, use Redis or similar)
const sessions = new Map<
  string,
  {
    transport: StreamableHTTPServerTransport;
    server: ReturnType<typeof createUnhookMCPServer>;
  }
>();

// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    // Remove sessions older than 1 hour
    if (now - (session as any).createdAt > 60 * 60 * 1000) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Helper to generate session ID
function generateSessionId(): string {
  return `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// POST /api/mcp - Handle MCP messages
export async function POST(request: NextRequest) {
  log('MCP POST request received');

  // Create the tRPC context with authentication
  const context = await createTRPCContext(request);

  // Check if user is authenticated
  if (!context.auth?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sessionId = request.headers.get('mcp-session-id');

    let session = sessionId ? sessions.get(sessionId) : null;

    // Handle initialization
    if (!session && isInitializeRequest(body)) {
      const newSessionId = generateSessionId();

      // Create transport with proper response handling
      const responseData: any[] = [];
      const responseHeaders: Record<string, string> = {};

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (id) => {
          responseHeaders['Mcp-Session-Id'] = id;
        },
        enableDnsRebindingProtection: true,
        allowedHosts: ['127.0.0.1', 'localhost', 'app.unhook.sh'],
      });

      // Create and connect server
      const server = createUnhookMCPServer(context);
      await server.connect(transport);

      // Store session
      session = { transport, server };
      (session as any).createdAt = Date.now();
      sessions.set(newSessionId, session);

      // Create mock response to capture output
      const mockRes = createMockResponse((data) => {
        responseData.push(data);
      });

      // Handle the request
      await transport.handleRequest(request as any, mockRes as any, body);

      // Return the response with session ID
      return NextResponse.json(responseData[0] || { success: true }, {
        headers: responseHeaders,
      });
    }

    if (!session) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Session not found or not initialized',
          },
          id: body.id || null,
        },
        { status: 400 },
      );
    }

    // Handle regular request
    const responseData: any[] = [];
    const mockRes = createMockResponse((data) => {
      responseData.push(data);
    });

    await session.transport.handleRequest(request as any, mockRes as any, body);

    return NextResponse.json(responseData[0] || { success: true });
  } catch (error) {
    log('Error handling MCP message:', error);
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
        id: null,
      },
      { status: 500 },
    );
  }
}

// GET /api/mcp - SSE endpoint for notifications
export async function GET(request: NextRequest) {
  log('MCP GET request received (SSE)');

  const sessionId = request.headers.get('mcp-session-id');
  const session = sessionId ? sessions.get(sessionId) : null;

  if (!session) {
    return new NextResponse('Session not found', { status: 404 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Mock response that writes to the stream
      const mockRes = {
        writeHead: () => {},
        write: (data: string) => {
          controller.enqueue(encoder.encode(data));
        },
        end: () => {
          controller.close();
        },
        setHeader: () => {},
      };

      try {
        await session.transport.handleRequest(request as any, mockRes as any);
      } catch (error) {
        log('SSE error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// DELETE /api/mcp - Close session
export async function DELETE(request: NextRequest) {
  const sessionId = request.headers.get('mcp-session-id');

  if (sessionId) {
    sessions.delete(sessionId);
  }

  return new NextResponse(null, { status: 204 });
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, mcp-session-id',
      'Access-Control-Expose-Headers': 'Mcp-Session-Id',
    },
  });
}

// Helper to create mock Express-like response
function createMockResponse(onJson: (data: any) => void) {
  return {
    statusCode: 200,
    headers: {},
    writeHead(status: number, headers?: Record<string, string>) {
      this.statusCode = status;
      if (headers) {
        Object.assign(this.headers, headers);
      }
    },
    write() {},
    end() {},
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      onJson(data);
    },
  };
}
