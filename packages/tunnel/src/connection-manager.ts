import { db } from '@acme/db/client';
import { TunnelConnections, Tunnels } from '@acme/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

import type { TunnelClientOptions } from './types';
import { log } from './utils/logger';

export class ConnectionManager {
  private readonly apiKey: string;
  private readonly metadata?: TunnelClientOptions['metadata'];
  private pingInterval?: NodeJS.Timeout;
  private isStopped = false;

  constructor(options: TunnelClientOptions) {
    this.apiKey = options.apiKey;
    this.metadata = options.metadata;
  }

  /**
   * Creates a new tunnel connection record and updates tunnel status
   */
  async createConnection(): Promise<void> {
    try {
      // Get tunnel info first
      const tunnel = await db.query.Tunnels.findFirst({
        where: eq(Tunnels.apiKey, this.apiKey),
      });

      if (!tunnel) {
        throw new Error(`Tunnel not found for apiKey: ${this.apiKey}`);
      }

      // Create connection record
      await db.insert(TunnelConnections).values({
        tunnelId: tunnel.id,
        clientId: this.metadata?.clientId ?? 'unknown',
        clientVersion: this.metadata?.clientVersion,
        clientOs: this.metadata?.clientOs,
        clientHostname: this.metadata?.clientHostname,
        userId: tunnel.userId,
        orgId: tunnel.orgId,
      });

      // Update tunnel status
      await db
        .update(Tunnels)
        .set({
          status: 'connected',
          lastSeenAt: new Date(),
        })
        .where(eq(Tunnels.id, tunnel.id));

      log.main('Created tunnel connection record');
    } catch (error) {
      log.error('Failed to create tunnel connection record:', error);
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
      // Get tunnel info first
      const tunnel = await db.query.Tunnels.findFirst({
        where: eq(Tunnels.apiKey, this.apiKey),
      });

      if (!tunnel) return;

      // Update tunnel and connection status
      await Promise.all([
        db
          .update(Tunnels)
          .set({
            status: 'connected',
            lastSeenAt: new Date(),
          })
          .where(eq(Tunnels.id, tunnel.id)),
        db
          .update(TunnelConnections)
          .set({
            lastPingAt: new Date(),
          })
          .where(
            and(
              eq(TunnelConnections.tunnelId, tunnel.id),
              isNull(TunnelConnections.disconnectedAt),
            ),
          ),
      ]);
    } catch (error) {
      log.error('Failed to update tunnel connection status:', error);
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
      const tunnel = await db.query.Tunnels.findFirst({
        where: eq(Tunnels.apiKey, this.apiKey),
      });

      if (!tunnel) return;

      await Promise.all([
        db
          .update(Tunnels)
          .set({
            status: 'disconnected',
            lastSeenAt: new Date(),
          })
          .where(eq(Tunnels.id, tunnel.id)),
        db
          .update(TunnelConnections)
          .set({
            disconnectedAt: new Date(),
          })
          .where(
            and(
              eq(TunnelConnections.tunnelId, tunnel.id),
              isNull(TunnelConnections.disconnectedAt),
            ),
          ),
      ]);

      log.main('Updated tunnel and connection status on disconnect');
    } catch (error) {
      log.error('Failed to update tunnel status on disconnect:', error);
    }
  }
}
