import { db } from '@unhook/db/client';
import { Events, Requests, Tunnels } from '@unhook/db/schema';
import { createId } from '@unhook/id';
import { filterHeaders } from '@unhook/tunnel';
import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// Mark as edge runtime to support streaming
// export const runtime = 'edge';

interface TunnelRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  size: number;
  body?: string;
  timestamp: number;
  contentType: string;
  clientIp: string;
}

function sanitizePath(path: string): string {
  // Remove any attempts at path traversal
  return path.replace(/\.\./g, '').replace(/\/+/g, '/');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tunnelId: string }> },
) {
  const { tunnelId } = await params;

  if (!tunnelId) {
    return new NextResponse('Tunnel ID required', { status: 400 });
  }

  const endpoint =
    req.headers.get('x-unhook-endpoint') ??
    req.nextUrl.searchParams.get('endpoint');

  // Get tunnel configuration
  const conditions = [eq(Tunnels.status, 'active'), eq(Tunnels.id, tunnelId)];

  const tunnel = await db.query.Tunnels.findFirst({
    where: and(...conditions),
  });

  if (!tunnel) {
    return new NextResponse('Invalid API key', { status: 401 });
  }

  // Ensure config exists with defaults
  const config = {
    requests: {
      ...tunnel.config.requests,
      allowedMethods: tunnel.config.requests?.allowedMethods ?? [],
      blockedPaths: tunnel.config.requests?.blockedPaths ?? [],
      allowedPaths: tunnel.config.requests?.allowedPaths ?? [],
    },
    storage: {
      ...tunnel.config.storage,
      storeRequestBody: tunnel.config.storage?.storeRequestBody ?? false,
      maxRequestBodySize:
        tunnel.config.storage?.maxRequestBodySize ?? 1024 * 1024 * 10, // 10MB default
      storeHeaders: tunnel.config.storage?.storeHeaders ?? true,
    },
    headers: tunnel.config.headers ?? {},
  };

  // Check request method restrictions
  if (
    config.requests.allowedMethods.length > 0 &&
    !config.requests.allowedMethods.includes(req.method)
  ) {
    return new NextResponse('Method not allowed', { status: 405 });
  }

  // Sanitize and check path restrictions
  const path = sanitizePath(`/${endpoint}`);
  if (config.requests.blockedPaths?.some((p) => path.match(p))) {
    return new NextResponse('Path not allowed', { status: 403 });
  }
  if (
    config.requests.allowedPaths?.length &&
    !config.requests.allowedPaths.some((p) => path.match(p))
  ) {
    return new NextResponse('Path not allowed', { status: 403 });
  }

  // Store the webhook request in Supabase
  try {
    let body: Buffer | undefined;
    let bodyBase64: string | undefined;

    if (req.body && config.storage.storeRequestBody) {
      body = Buffer.from(await req.arrayBuffer());
      if (body.length <= config.storage.maxRequestBodySize) {
        bodyBase64 = body.toString('base64');
      }
    }

    const headers = config.storage.storeHeaders
      ? filterHeaders(Object.fromEntries(req.headers.entries()), config.headers)
      : {};

    const request: TunnelRequest = {
      id: createId({ prefix: 'req' }),
      method: req.method,
      url: path,
      headers,
      size: body?.length ?? 0,
      body: bodyBase64,
      timestamp: Date.now(),
      contentType: req.headers.get('content-type') ?? 'text/plain',
      clientIp: req.headers.get('x-forwarded-for') ?? 'unknown',
    };

    // Create an event for this webhook
    const [event] = await db
      .insert(Events)
      .values({
        tunnelId: tunnel.id,
        userId: tunnel.userId,
        orgId: tunnel.orgId,
        originalRequest: request,
        status: 'pending',
        retryCount: 0,
        maxRetries: config.requests.maxRetries ?? 3,
        timestamp: new Date(),
      })
      .returning();

    if (!event) {
      return new NextResponse('Failed to create event', { status: 500 });
    }

    // Create the initial request associated with this event
    await db.insert(Requests).values({
      id: request.id,
      tunnelId: tunnel.id,
      eventId: event.id, // Associate with the event
      userId: tunnel.userId,
      orgId: tunnel.orgId,
      request,
      status: 'pending',
      timestamp: new Date(),
    });

    return new NextResponse('Webhook received', { status: 202 });
  } catch (error) {
    console.error('Error storing webhook request:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
