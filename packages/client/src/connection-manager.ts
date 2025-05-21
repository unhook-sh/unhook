import { db } from '@unhook/db/client';
import { Connections, Webhooks } from '@unhook/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

import type { WebhookClientOptions } from './types';
import { log } from './utils/logger';

export class ConnectionManager {
  private readonly webhookId: string;
  private readonly metadata?: WebhookClientOptions['metadata'];
  private pingInterval?: NodeJS.Timeout;
  private isStopped = false;

  constructor(options: WebhookClientOptions) {
    this.webhookId = options.webhookId;
    this.metadata = options.metadata;
  }

  /**
   * Creates a new webhook connection record and updates webhook status
   */
  async createConnection(): Promise<void> {
    try {
      // Get webhook info first
      const webhook = await db.query.Webhooks.findFirst({
        where: eq(Webhooks.id, this.webhookId),
      });

      if (!webhook) {
        throw new Error(`Webhook not found for webhookId: ${this.webhookId}`);
      }

      // Create connection record
      await db.insert(Connections).values({
        webhookId: webhook.id,
        ipAddress: this.metadata?.clientIp ?? '0.0.0.0', // Required field
        clientId: this.metadata?.clientId ?? 'unknown',
        clientVersion: this.metadata?.clientVersion,
        clientOs: this.metadata?.clientOs,
        clientHostname: this.metadata?.clientHostname,
        userId: webhook.userId,
        orgId: webhook.orgId,
      });

      // Update webhook status
      await db
        .update(Webhooks)
        .set({
          status: 'active',
        })
        .where(eq(Webhooks.id, webhook.id));

      log.main('Created webhook connection record');
    } catch (error) {
      log.error('Failed to create webhook connection record:', error);
    }
  }

  /**
   * Starts periodic ping updates for the connection
   */
  startPinging(): void {
    this.pingInterval = setInterval(async () => {
      if (this.isStopped) return;
      await this.updateConnectionStatus();
    }, 30000); // Every 30 seconds
  }

  /**
   * Updates the connection status in the database
   */
  private async updateConnectionStatus(): Promise<void> {
    try {
      // Get webhook info first
      const webhook = await db.query.Webhooks.findFirst({
        where: eq(Webhooks.id, this.webhookId),
      });

      if (!webhook) return;

      // Update webhook and connection status
      await Promise.all([
        db
          .update(Webhooks)
          .set({
            status: 'active',
          })
          .where(eq(Webhooks.id, webhook.id)),
        db
          .update(Connections)
          .set({
            lastPingAt: new Date(),
          })
          .where(
            and(
              eq(Connections.webhookId, webhook.id),
              isNull(Connections.disconnectedAt),
            ),
          ),
      ]);
    } catch (error) {
      log.error('Failed to update webhook connection status:', error);
    }
  }

  /**
   * Handles cleanup when the connection is stopped
   */
  async stop(): Promise<void> {
    if (this.isStopped) return;

    this.isStopped = true;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    try {
      const webhook = await db.query.Webhooks.findFirst({
        where: eq(Webhooks.id, this.webhookId),
      });

      if (!webhook) return;

      await Promise.all([
        db
          .update(Connections)
          .set({
            disconnectedAt: new Date(),
          })
          .where(
            and(
              eq(Connections.webhookId, webhook.id),
              isNull(Connections.disconnectedAt),
            ),
          ),
      ]);

      log.main('Updated webhook and connection status on disconnect');
    } catch (error) {
      log.error('Failed to update webhook status on disconnect:', error);
    }
  }
}
