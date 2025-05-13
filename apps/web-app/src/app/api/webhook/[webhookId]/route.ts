import { posthog } from '@unhook/analytics/posthog/server';
import { db } from '@unhook/db/client';
import { Events, type RequestPayload, Webhooks } from '@unhook/db/schema';
import { createId } from '@unhook/id';
import { filterHeaders } from '@unhook/webhook';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// Mark as edge runtime to support streaming
// export const runtime = 'edge';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string; apiKey?: string }> },
) {
  const { webhookId } = await params;

  if (!webhookId) {
    posthog.capture({
      event: 'webhook_error',
      distinctId: 'anonymous',
      properties: {
        error: 'missing_webhook_id',
        webhookId: null,
      },
    });
    return new NextResponse('Webhook ID required', { status: 400 });
  }

  let from =
    req.headers.get('x-unhook-from') ?? req.nextUrl.searchParams.get('from');
  const apiKey =
    req.headers.get('x-unhook-api-key') ??
    req.nextUrl.searchParams.get('apiKey');

  // If no from is provided, send to all endpoints that match from = *
  if (!from) {
    from = '*';
  }

  // Get webhook configuration
  const webhook = await db.query.Webhooks.findFirst({
    where: eq(Webhooks.id, webhookId),
  });

  if (!webhook) {
    posthog.capture({
      event: 'webhook_error',
      distinctId: 'anonymous',
      properties: {
        error: 'webhook_not_found',
        webhookId,
      },
    });
    return new NextResponse('Webhook not found', { status: 404 });
  }

  const userId = webhook.userId;

  if (webhook.isPrivate) {
    if (!apiKey) {
      posthog.capture({
        event: 'webhook_error',
        distinctId: userId,
        properties: {
          error: 'missing_api_key',
          webhookId,
        },
      });
      return new NextResponse('Invalid API key', { status: 401 });
    }

    if (apiKey !== webhook.apiKey) {
      posthog.capture({
        event: 'webhook_error',
        distinctId: userId,
        properties: {
          error: 'invalid_api_key',
          webhookId,
        },
      });
      return new NextResponse('Invalid API key', { status: 401 });
    }
  }

  if (webhook.status === 'inactive') {
    posthog.capture({
      event: 'webhook_error',
      distinctId: userId,
      properties: {
        error: 'webhook_inactive',
        webhookId,
      },
    });
    return new NextResponse('Webhook is inactive', { status: 403 });
  }

  // Ensure config exists with defaults
  const config = {
    requests: {
      ...webhook.config.requests,
      allowedMethods: webhook.config.requests?.allowedMethods ?? [],
      blockedFrom: webhook.config.requests?.blockedFrom ?? [],
      allowedFrom: webhook.config.requests?.allowedFrom ?? [],
    },
    storage: {
      ...webhook.config.storage,
      storeRequestBody: webhook.config.storage?.storeRequestBody ?? false,
      maxRequestBodySize:
        webhook.config.storage?.maxRequestBodySize ?? 1024 * 1024 * 10, // 10MB default
      storeHeaders: webhook.config.storage?.storeHeaders ?? true,
    },
    headers: webhook.config.headers ?? {},
  };

  // Check request method restrictions
  if (
    config.requests.allowedMethods.length > 0 &&
    !config.requests.allowedMethods.includes(req.method)
  ) {
    posthog.capture({
      event: 'webhook_error',
      distinctId: userId,
      properties: {
        error: 'method_not_allowed',
        webhookId,
        method: req.method,
        allowedMethods: config.requests.allowedMethods,
      },
    });
    return new NextResponse('Method not allowed', { status: 405 });
  }

  // Sanitize and check path restrictions
  if (config.requests.blockedFrom?.some((p) => from?.match(p))) {
    posthog.capture({
      event: 'webhook_error',
      distinctId: userId,
      properties: {
        error: 'from_blocked',
        webhookId,
        from,
        blockedFrom: config.requests.blockedFrom,
      },
    });
    return new NextResponse('From not allowed', { status: 403 });
  }
  if (
    config.requests.allowedFrom?.length &&
    !config.requests.allowedFrom.some((p) => from?.match(p))
  ) {
    posthog.capture({
      event: 'webhook_error',
      distinctId: userId,
      properties: {
        error: 'from_not_allowed',
        webhookId,
        from,
        allowedFrom: config.requests.allowedFrom,
      },
    });
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
        webhookId: webhook.id,
        userId: webhook.userId,
        orgId: webhook.orgId,
        originRequest: request,
        from,
        status: 'pending',
        retryCount: 0,
        maxRetries: config.requests.maxRetries ?? 3,
        timestamp: new Date(),
      })
      .returning();

    if (!event) {
      posthog.capture({
        event: 'webhook_error',
        distinctId: userId,
        properties: {
          error: 'failed_to_create_event',
          webhookId,
          from,
        },
      });
      return new NextResponse('Failed to create event', { status: 500 });
    }

    posthog.capture({
      event: 'webhook_received',
      distinctId: userId,
      properties: {
        webhookId,
        from,
        apiKey,
      },
    });

    return new NextResponse('Webhook received', { status: 202 });
  } catch (error) {
    console.error('Error storing webhook request:', error);
    posthog.captureException(error, userId, {
      properties: {
        webhookId,
        from,
        apiKey,
      },
    });
    return new NextResponse('Internal server error', { status: 500 });
  }
}
