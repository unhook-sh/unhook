import { posthog } from '@unhook/analytics/posthog/server';
import { filterHeaders } from '@unhook/client/utils/headers';
import { trackApiKeyUsage } from '@unhook/db';
import { db } from '@unhook/db/client';
import { Events, Orgs, type RequestPayload, Webhooks } from '@unhook/db/schema';
import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// Mark as edge runtime to support streaming
// export const runtime = 'edge';

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ orgName: string; webhookName: string; apiKey?: string }>;
  },
) {
  try {
    const { orgName, webhookName } = await params;

    if (!orgName || !webhookName) {
      posthog.capture({
        distinctId: 'anonymous',
        event: 'webhook_error',
        properties: {
          error: 'missing_org_name_or_webhook_name',
          orgName,
          webhookName,
        },
      });
      return NextResponse.json(
        {
          docs: 'https://docs.unhook.sh',
          error: 'Organization name and webhook name required',
          help: 'Please provide both organization name and webhook name in the URL path',
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

    // First, find the organization by name
    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.name, orgName),
    });

    if (!org) {
      posthog.capture({
        distinctId: 'anonymous',
        event: 'webhook_error',
        properties: {
          error: 'org_not_found',
          orgName,
          webhookName,
        },
      });
      return NextResponse.json(
        {
          docs: 'https://docs.unhook.sh',
          error: 'Organization not found',
          help: `The organization '${orgName}' does not exist`,
          orgName,
        },
        { status: 404 },
      );
    }

    // Get webhook configuration within the organization by name
    const webhook = await db.query.Webhooks.findFirst({
      where: and(eq(Webhooks.name, webhookName), eq(Webhooks.orgId, org.id)),
    });

    if (!webhook) {
      posthog.capture({
        distinctId: 'anonymous',
        event: 'webhook_error',
        properties: {
          error: 'webhook_not_found_in_org',
          orgId: org.id,
          orgName,
          webhookName,
        },
      });
      return NextResponse.json(
        {
          docs: 'https://docs.unhook.sh',
          error: 'Webhook not found',
          help: `The webhook '${webhookName}' does not exist in organization '${orgName}'`,
          orgName,
          webhookName,
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
            orgName,
            webhookName,
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
            orgName,
            webhookName,
          },
        });
        return NextResponse.json(
          {
            docs: 'https://docs.unhook.sh',
            error: 'Invalid API key',
            help: 'The provided API key is not valid for this webhook',
          },
          { status: 401 },
        );
      }
    }

    // Track API key usage if provided
    if (apiKey) {
      try {
        await trackApiKeyUsage({
          apiKey,
          metadata: { source, webhookName },
          orgId: webhook.orgId,
          type: 'webhook-event',
          userId: webhook.userId,
        });
      } catch (error) {
        console.error('Failed to track API key usage:', error);
      }
    }

    const body = await req.text();
    const bodyBase64 = Buffer.from(body).toString('base64');
    // Create event record
    const eventPayload: RequestPayload = {
      body: bodyBase64,
      clientIp:
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown',
      contentType:
        req.headers.get('content-type') || 'application/octet-stream',
      headers: filterHeaders(Object.fromEntries(req.headers.entries()), {}),
      method: req.method,
      size: Number.parseInt(req.headers.get('content-length') || '0', 10),
      sourceUrl: req.url,
    };

    try {
      const [event] = await db
        .insert(Events)
        .values({
          apiKeyId: webhook.apiKeyId,
          maxRetries: 3,
          orgId: webhook.orgId,
          originRequest: eventPayload,
          retryCount: 0,
          source,
          status: 'pending',
          timestamp: new Date(),
          userId: webhook.userId,
          webhookId: webhook.id,
        })
        .returning();

      if (!event) {
        throw new Error('Failed to create event');
      }

      // Update webhook request count and last request time
      await db
        .update(Webhooks)
        .set({
          lastRequestAt: new Date(),
          requestCount: webhook.requestCount + 1,
        })
        .where(eq(Webhooks.id, webhook.id));

      // Track successful webhook reception
      posthog.capture({
        distinctId: userId,
        event: 'webhook_received',
        properties: {
          event_id: event.id,
          org_name: orgName,
          source,
          webhook_name: webhookName,
        },
      });

      return NextResponse.json({
        docs: 'https://docs.unhook.sh',
        eventId: event.id,
        message: 'Webhook received successfully',
        orgName,
        webhookName,
      });
    } catch (error) {
      console.error('Failed to process webhook:', error);

      posthog.capture({
        distinctId: userId,
        event: 'webhook_error',
        properties: {
          error: 'event_creation_failed',
          orgName,
          source,
          webhookName,
        },
      });

      return NextResponse.json(
        {
          docs: 'https://docs.unhook.sh',
          error: 'Internal server error',
          help: 'Failed to process webhook. Please try again later.',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Webhook route error:', error);

    return NextResponse.json(
      {
        docs: 'https://docs.unhook.sh',
        error: 'Internal server error',
        help: 'Failed to process webhook. Please try again later.',
      },
      { status: 500 },
    );
  }
}
