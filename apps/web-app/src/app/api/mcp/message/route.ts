import { createTRPCContext } from '@unhook/api';
import { debug } from '@unhook/logger';
import { MCPSSETransport } from '@unhook/mcp-server';
import { NextRequest, NextResponse } from 'next/server';

const log = debug('unhook:api:mcp:message');

// POST /api/mcp/message - Handle MCP messages
export async function POST(request: NextRequest) {
  log('MCP message received');

  // Create the tRPC context with authentication
  const context = await createTRPCContext(request);

  // Check if user is authenticated
  if (!context.auth?.userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();

    // Create MCP SSE transport
    const transport = new MCPSSETransport(context);

    // Handle the message
    const response = await transport.handleMessage(body);

    if (response) {
      return NextResponse.json(response);
    } else {
      // No response for notifications
      return new NextResponse(null, { status: 204 });
    }
  } catch (error) {
    log('Error handling MCP message:', error);
    return NextResponse.json(
      {
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 },
    );
  }
}

// OPTIONS /api/mcp/message - Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
