import { NextRequest, NextResponse } from 'next/server';

// Mark as edge runtime to support streaming
export const runtime = 'edge';

/**
 * GET handler for Server-Sent Events (SSE)
 * This endpoint is used to establish a real-time connection for MCP updates
 */
export async function GET(req: NextRequest) {
  // Verify authentication
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        help: 'Please provide a valid bearer token in the Authorization header',
      },
      { status: 401 },
    );
  }

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  });

  // Handle client disconnect
  req.signal.addEventListener('abort', () => {
    writer.close();
  });

  // Send initial connection message
  writer.write(
    encoder.encode('event: connected\ndata: {"status": "connected"}\n\n'),
  );

  // Return the streaming response
  return new Response(stream.readable, { headers });
}
