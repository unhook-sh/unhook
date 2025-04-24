import { db } from '@unhook/db/client';
import { Events, type RequestPayload, Tunnels } from '@unhook/db/schema';
import { createId } from '@unhook/id';
import { filterHeaders } from '@unhook/tunnel';
import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// Mark as edge runtime to support streaming
// export const runtime = 'edge';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tunnelId: string }> },
) {
  const { tunnelId } = await params;

  if (!tunnelId) {
    return new NextResponse('Tunnel ID required', { status: 400 });
  }

  let from =
    req.headers.get('x-unhook-from') ?? req.nextUrl.searchParams.get('from');

  // If no from is provided, send to all endpoints that match from = *
  if (!from) {
    from = '*';
  }

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
      blockedFrom: tunnel.config.requests?.blockedFrom ?? [],
      allowedFrom: tunnel.config.requests?.allowedFrom ?? [],
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
  if (config.requests.blockedFrom?.some((p) => from?.match(p))) {
    return new NextResponse('From not allowed', { status: 403 });
  }
  if (
    config.requests.allowedFrom?.length &&
    !config.requests.allowedFrom.some((p) => from?.match(p))
  ) {
    return new NextResponse('From not allowed', { status: 403 });
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

    // Get the request origin information from various possible headers
    const requestUrl = req.url;
    const origin = req.headers.get('origin');
    const headerReferer =
      req.headers.get('referer') || req.headers.get('referrer');
    const propertyReferer = req.referrer; // Next.js Request object's referrer property
    const referer = propertyReferer || headerReferer;
    const host = req.headers.get('host');

    // Determine the most likely source URL
    const sourceUrl = origin || referer || `https://${host}` || requestUrl;

    console.log('Webhook Request Details:', {
      requestUrl,
      sourceUrl,
      origin,
      headerReferer,
      propertyReferer,
      host,
      headers: JSON.stringify(headers),
    });

    const request: RequestPayload = {
      id: createId({ prefix: 'req' }),
      method: req.method,
      headers,
      sourceUrl,
      size: body?.length ?? 0,
      body: bodyBase64,
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
        originRequest: request,
        from,
        status: 'pending',
        retryCount: 0,
        maxRetries: config.requests.maxRetries ?? 3,
        timestamp: new Date(),
      })
      .returning();

    if (!event) {
      return new NextResponse('Failed to create event', { status: 500 });
    }

    return new NextResponse('Webhook received', { status: 202 });
  } catch (error) {
    console.error('Error storing webhook request:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
