import { db } from '@acme/db/client';
import { WebhookRequests } from '@acme/db/schema';
import { type NextRequest, NextResponse } from 'next/server';

// Mark as edge runtime to support streaming
export const runtime = 'edge';

interface TunnelRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string; // base64 encoded
  timestamp: number;
}

export async function POST(req: NextRequest) {
  const apiKey =
    req.headers.get('x-api-key') ?? req.nextUrl.searchParams.get('apiKey');
  if (!apiKey) {
    return new NextResponse('API key required', { status: 401 });
  }

  // Store the webhook request in Supabase
  try {
    const request: TunnelRequest = {
      id: crypto.randomUUID(),
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      body: req.body
        ? Buffer.from(await req.arrayBuffer()).toString('base64')
        : undefined,
      timestamp: Date.now(),
    };

    await db.insert(WebhookRequests).values({
      id: request.id,
      tunnelId: apiKey,
      connectionId: 'conn_2vCR1xwHHTLxE5m20AYewlc5y2j',
      apiKey: apiKey,
      userId: 'user_2vCQ1eiMB46gXpAUNeK8LvO7CwT',
      orgId: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j',
      request: request,
      status: 'pending',
      createdAt: new Date(),
    });

    return new NextResponse('Webhook received', { status: 202 });
  } catch (error) {
    console.error('Error storing webhook request:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// For creating new API keys
export async function PUT(req: NextRequest) {
  const newApiKey = crypto.randomUUID();

  try {
    // Store the API key in Supabase
    await db.insert(WebhookRequests).values({
      orgId: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j',
      connectionId: 'conn_2vCR1xwHHTLxE5m20AYewlc5y2j',
      apiKey: newApiKey,
      request: {
        id: crypto.randomUUID(),
        method: 'PUT',
        url: req.url,
        headers: {},
        timestamp: Date.now(),
      },
      status: 'completed',
      tunnelId: newApiKey,
      userId: 'user_2vCQ1eiMB46gXpAUNeK8LvO7CwT',
    });

    return NextResponse.json({ apiKey: newApiKey });
  } catch (error) {
    console.error('Error creating API key:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
