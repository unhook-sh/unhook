import { posthog } from '@unhook/analytics/posthog/server';
import { filterHeaders } from '@unhook/client/utils/headers';
import { trackApiKeyUsage } from '@unhook/db';
import { db } from '@unhook/db/client';
import { Events, Orgs, type RequestPayload, Webhooks } from '@unhook/db/schema';
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
      distinctId: 'anonymous',
      event: 'webhook_error',
      properties: {
        error: 'missing_webhook_id',
        webhookId: null,
      },
    });
    return NextResponse.json(
      {
        docs: 'https://docs.unhook.sh',
        error: 'Webhook ID required',
        help: 'Please provide a valid webhook ID in the URL path',
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
      distinctId: 'anonymous',
      event: 'webhook_error',
      properties: {
        error: 'webhook_not_found',
        webhookId,
      },
    });
    return NextResponse.json(
      {
        docs: 'https://docs.unhook.sh',
        error: 'Webhook not found',
        help: 'The webhook ID provided does not exist or has been deleted',
        webhookId,
      },
      { status: 404 },
    );
  }

  const userId = webhook.userId;

  if (webhook.isPrivate) {
    if (!apiKey) {
      posthog.capture({
        distinctId: userId,
        event: 'webhook_error',
        properties: {
          error: 'missing_api_key',
          webhookId,
        },
      });
      return NextResponse.json(
        {
          docs: 'https://docs.unhook.sh',
          error: 'Invalid API key',
          help: 'Please provide a valid API key in the x-unhook-api-key header or apiKey query parameter',
        },
        { status: 401 },
      );
    }

    if (apiKey !== webhook.apiKeyId) {
      posthog.capture({
        distinctId: userId,
        event: 'webhook_error',
        properties: {
          error: 'invalid_api_key',
          webhookId,
        },
      });
      return NextResponse.json(
        {
          docs: 'https://docs.unhook.sh',
          error: 'Invalid API key',
          help: 'The provided API key does not match the webhook configuration',
        },
        { status: 401 },
      );
    }
  }

  // Track API key usage if provided
  if (apiKey) {
    const dbApiKey = await trackApiKeyUsage({
      apiKey,
      metadata: {
        webhookId: webhook.id,
      },
      orgId: webhook.orgId,
      type: 'webhook-event',
      userId: webhook.userId,
    });

    if (dbApiKey?.isActive) {
      posthog.capture({
        distinctId: userId,
        event: 'api_key_usage',
        properties: {
          apiKey: dbApiKey.key,
          webhookId,
        },
      });
    } else if (dbApiKey?.isActive === false && webhook.isPrivate) {
      posthog.capture({
        distinctId: userId,
        event: 'api_key_error',
        properties: {
          error: 'api_key_invalid',
          webhookId,
        },
      });
      return NextResponse.json(
        {
          docs: 'https://docs.unhook.sh',
          error: 'Invalid API key',
          help: 'The provided API key is invalid or has been deactivated',
        },
        { status: 401 },
      );
    }
  }

  if (webhook.status === 'inactive') {
    posthog.capture({
      distinctId: userId,
      event: 'webhook_error',
      properties: {
        error: 'webhook_inactive',
        webhookId,
      },
    });
    return NextResponse.json(
      {
        docs: 'https://docs.unhook.sh',
        error: 'Webhook is inactive',
        help: 'This webhook has been deactivated. Please reactivate it in the dashboard to continue receiving events',
        webhookId,
      },
      { status: 403 },
    );
  }

  // Ensure config exists with defaults
  const config = {
    headers: webhook.config.headers ?? {},
    requests: {
      ...webhook.config.requests,
      allowedMethods: webhook.config.requests?.allowedMethods ?? [],
      allowedSource: webhook.config.requests?.allowedSource ?? [],
      blockedSource: webhook.config.requests?.blockedSource ?? [],
    },
    storage: {
      ...webhook.config.storage,
      maxRequestBodySize:
        webhook.config.storage?.maxRequestBodySize ?? 1024 * 1024 * 10,
      storeHeaders: webhook.config.storage?.storeHeaders ?? true, // 10MB default
      storeRequestBody: webhook.config.storage?.storeRequestBody ?? false,
    },
  };

  // Check request method restrictions
  if (
    config.requests.allowedMethods.length > 0 &&
    !config.requests.allowedMethods.includes(req.method)
  ) {
    posthog.capture({
      distinctId: userId,
      event: 'webhook_error',
      properties: {
        allowedMethods: config.requests.allowedMethods,
        error: 'method_not_allowed',
        method: req.method,
        webhookId,
      },
    });
    return NextResponse.json(
      {
        docs: 'https://docs.unhook.sh',
        error: 'Method not allowed',
        help: 'This webhook does not accept requests with this method',
        method: req.method,
      },
      { status: 405 },
    );
  }

  // Sanitize and check path restrictions
  if (config.requests.blockedSource?.some((p) => source?.match(p))) {
    posthog.capture({
      distinctId: userId,
      event: 'webhook_error',
      properties: {
        blockedSource: config.requests.blockedSource,
        error: 'source_blocked',
        source,
        webhookId,
      },
    });
    return NextResponse.json(
      {
        docs: 'https://docs.unhook.sh',
        error: 'Source not allowed',
        help: 'The source of this request is blocked by the webhook configuration',
        source,
      },
      { status: 403 },
    );
  }
  if (
    config.requests.allowedSource?.length > 0 &&
    !config.requests.allowedSource.some((p) => source?.match(p))
  ) {
    posthog.capture({
      distinctId: userId,
      event: 'webhook_error',
      properties: {
        allowedSource: config.requests.allowedSource,
        error: 'source_not_allowed',
        source,
        webhookId,
      },
    });
    return NextResponse.json(
      {
        docs: 'https://docs.unhook.sh',
        error: 'Source not allowed',
        help: 'The source of this request is not in the allowed list',
        source,
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
      body: bodyBase64,
      clientIp: req.headers.get('x-forwarded-for') ?? 'unknown',
      contentType: req.headers.get('content-type') ?? 'text/plain',
      headers,
      id: createId({ prefix: 'req' }),
      method: req.method,
      size: body?.length ?? 0,
      sourceUrl,
    };

    // Create an event for this webhook
    const [event] = await db
      .insert(Events)
      .values({
        apiKeyId: webhook.apiKeyId,
        maxRetries: config.requests.maxRetries ?? 3,
        orgId: webhook.orgId,
        originRequest: request,
        retryCount: 0,
        source,
        status: 'pending',
        timestamp: new Date(),
        userId: webhook.userId,
        webhookId: webhook.id,
      })
      .returning();

    if (!event) {
      posthog.capture({
        distinctId: userId,
        event: 'webhook_error',
        properties: {
          error: 'failed_to_create_event',
          source,
          webhookId,
        },
      });
      return NextResponse.json(
        {
          docs: 'https://docs.unhook.sh',
          error: 'Failed to create event',
          help: 'There was an error processing your webhook request. Please try again later',
          webhookId,
        },
        { status: 500 },
      );
    }

    posthog.capture({
      distinctId: userId,
      event: 'webhook_received',
      properties: {
        apiKey,
        source,
        webhookId,
      },
    });

    // Record usage for billing
    try {
      // Get the organization's Stripe customer ID
      const org = await db.query.Orgs.findFirst({
        where: eq(Orgs.id, webhook.orgId),
      });

      if (org?.stripeCustomerId && org?.stripeSubscriptionStatus === 'active') {
        // Record the webhook event usage to Stripe
        // await recordUsage({
        //   customerId: org.stripeCustomerId,
        //   idempotencyKey: event.id,
        //   quantity: 1, // Use event ID for idempotency
        // });
      }
    } catch (error) {
      // Log error but don't fail the webhook request
      console.error('Failed to record usage:', error);
      posthog.captureException(error, userId, {
        properties: {
          eventId: event.id,
          orgId: webhook.orgId,
          webhookId,
        },
      });
    }

    return NextResponse.json(
      {
        docs: 'https://docs.unhook.sh',
        eventId: event.id,
        message: 'Webhook received',
        webhookId,
      },
      { status: 202 },
    );
  } catch (error) {
    console.error('Error storing webhook request:', error);
    posthog.captureException(error, userId, {
      properties: {
        apiKey,
        source,
        webhookId,
      },
    });
    return NextResponse.json(
      {
        docs: 'https://docs.unhook.sh',
        error: 'Internal server error',
        help: 'An unexpected error occurred while processing your webhook request. Please try again later',
        webhookId,
      },
      { status: 500 },
    );
  }
}
