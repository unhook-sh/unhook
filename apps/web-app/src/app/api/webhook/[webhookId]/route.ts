import { posthog } from '@unhook/analytics/posthog/server';
import { filterHeaders } from '@unhook/client';
import { db } from '@unhook/db/client';
import { Events, type RequestPayload, Webhooks } from '@unhook/db/schema';
import { createId } from '@unhook/id';
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
    return NextResponse.json(
      {
        error: 'Webhook ID required',
        help: 'Please provide a valid webhook ID in the URL path',
        docs: 'https://docs.unhook.sh',
      },
      { status: 400 },
    );
  }

  let source =
    req.headers.get('x-unhook-source') ??
    req.nextUrl.searchParams.get('source');
  const apiKey =
    req.headers.get('x-unhook-api-key') ??
    req.nextUrl.searchParams.get('apiKey');

  // If no source is provided, send to all endpoints that match source = *
  if (!source) {
    source = '*';
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
    return NextResponse.json(
      {
        error: 'Webhook not found',
        help: 'The webhook ID provided does not exist or has been deleted',
        webhookId,
        docs: 'https://docs.unhook.sh',
      },
      { status: 404 },
    );
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
      return NextResponse.json(
        {
          error: 'Invalid API key',
          help: 'Please provide a valid API key in the x-unhook-api-key header or apiKey query parameter',
          docs: 'https://docs.unhook.sh',
        },
        { status: 401 },
      );
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
      return NextResponse.json(
        {
          error: 'Invalid API key',
          help: 'The provided API key does not match the webhook configuration',
          docs: 'https://docs.unhook.sh',
        },
        { status: 401 },
      );
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
    return NextResponse.json(
      {
        error: 'Webhook is inactive',
        help: 'This webhook has been deactivated. Please reactivate it in the dashboard to continue receiving events',
        webhookId,
        docs: 'https://docs.unhook.sh',
      },
      { status: 403 },
    );
  }

  // Ensure config exists with defaults
  const config = {
    requests: {
      ...webhook.config.requests,
      allowedMethods: webhook.config.requests?.allowedMethods ?? [],
      blockedSource: webhook.config.requests?.blockedSource ?? [],
      allowedSource: webhook.config.requests?.allowedSource ?? [],
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
    return NextResponse.json(
      {
        error: 'Method not allowed',
        help: 'This webhook does not accept requests with this method',
        method: req.method,
        docs: 'https://docs.unhook.sh',
      },
      { status: 405 },
    );
  }

  // Sanitize and check path restrictions
  if (config.requests.blockedSource?.some((p) => source?.match(p))) {
    posthog.capture({
      event: 'webhook_error',
      distinctId: userId,
      properties: {
        error: 'source_blocked',
        webhookId,
        source,
        blockedSource: config.requests.blockedSource,
      },
    });
    return NextResponse.json(
      {
        error: 'Source not allowed',
        help: 'The source of this request is blocked by the webhook configuration',
        source,
        docs: 'https://docs.unhook.sh',
      },
      { status: 403 },
    );
  }
  if (
    config.requests.allowedSource?.length > 0 &&
    !config.requests.allowedSource.some((p) => source?.match(p))
  ) {
    posthog.capture({
      event: 'webhook_error',
      distinctId: userId,
      properties: {
        error: 'source_not_allowed',
        webhookId,
        source,
        allowedSource: config.requests.allowedSource,
      },
    });
    return NextResponse.json(
      {
        error: 'Source not allowed',
        help: 'The source of this request is not in the allowed list',
        source,
        docs: 'https://docs.unhook.sh',
      },
      { status: 403 },
    );
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
        source,
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
          source,
        },
      });
      return NextResponse.json(
        {
          error: 'Failed to create event',
          help: 'There was an error processing your webhook request. Please try again later',
          webhookId,
          docs: 'https://docs.unhook.sh',
        },
        { status: 500 },
      );
    }

    posthog.capture({
      event: 'webhook_received',
      distinctId: userId,
      properties: {
        webhookId,
        source,
        apiKey,
      },
    });

    return NextResponse.json(
      {
        message: 'Webhook received',
        webhookId,
        eventId: event.id,
        docs: 'https://docs.unhook.sh',
      },
      { status: 202 },
    );
  } catch (error) {
    console.error('Error storing webhook request:', error);
    posthog.captureException(error, userId, {
      properties: {
        webhookId,
        source,
        apiKey,
      },
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        help: 'An unexpected error occurred while processing your webhook request. Please try again later',
        webhookId,
        docs: 'https://docs.unhook.sh',
      },
      { status: 500 },
    );
  }
}
