import { db } from '@acme/db/client';
import { Requests, Tunnels } from '@acme/db/schema';
import { createId } from '@acme/id';
import { filterHeaders } from '@acme/tunnel';
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

export async function POST(req: NextRequest) {
  console.log('req', req);
  const apiKey =
    req.headers.get('x-api-key') ?? req.nextUrl.searchParams.get('key');
  if (!apiKey) {
    return new NextResponse('API key required', { status: 401 });
  }
  const endpoint =
    req.headers.get('x-endpoint') ?? req.nextUrl.searchParams.get('endpoint');
  if (!endpoint) {
    return new NextResponse('Endpoint required', { status: 401 });
  }

  // Get tunnel configuration
  const tunnel = await db.query.Tunnels.findFirst({
    where: and(eq(Tunnels.apiKey, apiKey), eq(Tunnels.status, 'active')),
  });

  if (!tunnel) {
    return new NextResponse('Invalid API key', { status: 401 });
  }

  // Check request method restrictions
  if (
    tunnel.config.requests.allowedMethods &&
    !tunnel.config.requests.allowedMethods.includes(req.method)
  ) {
    return new NextResponse('Method not allowed', { status: 405 });
  }

  // Check path restrictions
  const path = `/${endpoint}`;
  if (tunnel.config.requests.blockedPaths?.some((p) => path.match(p))) {
    return new NextResponse('Path not allowed', { status: 403 });
  }
  if (
    tunnel.config.requests.allowedPaths?.length &&
    !tunnel.config.requests.allowedPaths.some((p) => path.match(p))
  ) {
    return new NextResponse('Path not allowed', { status: 403 });
  }

  // Store the webhook request in Supabase
  try {
    let body: Buffer | undefined;
    let bodyBase64: string | undefined;

    if (req.body && tunnel.config.storage.storeRequestBody) {
      body = Buffer.from(await req.arrayBuffer());
      if (body.length <= tunnel.config.storage.maxRequestBodySize) {
        bodyBase64 = body.toString('base64');
      }
    }

    const headers = tunnel.config.storage.storeHeaders
      ? filterHeaders(
          Object.fromEntries(req.headers.entries()),
          tunnel.config.headers,
        )
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

    await db.insert(Requests).values({
      id: request.id,
      tunnelId: tunnel.id,
      apiKey,
      userId: tunnel.userId,
      orgId: tunnel.orgId,
      request,
      status: 'pending',
      createdAt: new Date(),
    });

    return new NextResponse('Webhook received', { status: 202 });
  } catch (error) {
    console.error('Error storing webhook request:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
