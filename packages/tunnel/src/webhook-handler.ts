import { db } from '@acme/db/client';
import { WebhookRequests } from '@acme/db/schema';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { fetch } from 'undici';

import type { WebhookRecord } from './types';
import { log } from './utils/logger';

export class WebhookHandler {
  private readonly localAddr: string;
  private isStopped = false;

  constructor({ port }: { port: number }) {
    this.localAddr = `http://localhost:${port}`;
  }

  /**
   * Handles an incoming webhook request
   */
  async handleRequest(
    payload: RealtimePostgresChangesPayload<WebhookRecord>,
  ): Promise<void> {
    if (this.isStopped) return;

    // The new record is guaranteed to exist since we're listening to INSERT events
    const record = payload.new as WebhookRecord;
    if (record.status !== 'pending') return;

    log.request('Received webhook request %s', record.id);
    log.request('Request details: %o', {
      method: record.request.method,
      url: record.request.url,
      headers: record.request.headers,
    });

    try {
      await this.forwardRequest(record);
    } catch (error) {
      await this.handleError(record.id, error);
    }
  }

  /**
   * Forwards the request to the local service and updates the response
   */
  private async forwardRequest(record: WebhookRecord): Promise<void> {
    // Forward request to local service
    const response = await fetch(
      this.localAddr + new URL(record.request.url).pathname,
      {
        method: record.request.method,
        headers: record.request.headers,
        body: record.request.body
          ? Buffer.from(record.request.body, 'base64')
          : undefined,
      },
    );

    // Read response
    const responseBody = await response.arrayBuffer();
    const responseBodyBase64 = Buffer.from(responseBody).toString('base64');

    log.response('Response for request %s: %d', record.id, response.status);
    log.response(
      'Response headers: %o',
      Object.fromEntries(response.headers.entries()),
    );

    // Update request status and response
    await db
      .update(WebhookRequests)
      .set({
        status: 'completed',
        completedAt: new Date(),
        response: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBodyBase64,
        },
      })
      .where(eq(WebhookRequests.id, record.id));

    log.response('Updated request %s status to completed', record.id);
  }

  /**
   * Handles errors that occur during request processing
   */
  private async handleError(requestId: string, error: unknown): Promise<void> {
    log.error('Error processing webhook request %s: %o', requestId, error);

    // Update request status to failed
    await db
      .update(WebhookRequests)
      .set({
        status: 'failed',
        completedAt: new Date(),
        response: {
          status: 500,
          headers: { 'content-type': 'text/plain' },
          body: Buffer.from(
            error instanceof Error ? error.message : 'Internal error',
          ).toString('base64'),
        },
      })
      .where(eq(WebhookRequests.id, requestId));

    log.error('Updated request %s status to failed', requestId);
  }

  /**
   * Stops the webhook handler
   */
  stop(): void {
    this.isStopped = true;
  }
}
