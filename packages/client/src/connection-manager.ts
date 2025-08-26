import { db } from '@unhook/db/client';
import { Connections, Webhooks } from '@unhook/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

import type { WebhookClientOptions } from './types';
import { log } from './utils/logger';

export class ConnectionManager {
  private readonly webhookUrl: string;
  private readonly webhookName: string;
  private readonly metadata?: WebhookClientOptions['metadata'];
  private pingInterval?: NodeJS.Timeout;
  private isStopped = false;

  constructor(options: WebhookClientOptions) {
    this.webhookUrl = options.webhookUrl;
    // Extract webhook name from the URL (e.g., https://unhook.sh/org/webhook-name -> webhook-name)
    this.webhookName = this.extractWebhookNameFromUrl(options.webhookUrl);
    this.metadata = options.metadata;
  }

  private extractWebhookNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        return pathParts.at(-1) || ''; // Last part is the webhook name
      }
      throw new Error('Invalid webhook URL format');
    } catch (error) {
      console.error('Invalid webhook URL:', {
        error,
        url,
      });
      throw new Error(`Invalid webhook URL: ${url}`);
    }
  }

  /**
   * Creates a new webhook connection record and updates webhook status
   */
  async createConnection(): Promise<void> {
    try {
      // Get webhook info first
      const webhook = await db.query.Webhooks.findFirst({
        where: eq(Webhooks.name, this.webhookName),
      });

      if (!webhook) {
        throw new Error(
          `Webhook not found for webhookName: ${this.webhookName}`,
        );
      }

      // Create connection record
      await db.insert(Connections).values({
        clientHostname: this.metadata?.clientHostname,
        clientId: this.metadata?.clientId ?? 'unknown', // Required field
        clientOs: this.metadata?.clientOs,
        clientVersion: this.metadata?.clientVersion,
        ipAddress: this.metadata?.clientIp ?? '0.0.0.0',
        orgId: webhook.orgId,
        userId: webhook.userId,
        webhookId: webhook.id,
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
        where: eq(Webhooks.name, this.webhookName),
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
        where: eq(Webhooks.name, this.webhookName),
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
