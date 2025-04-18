import { db } from '@unhook/db/client';
import { Connections, Tunnels } from '@unhook/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

import type { TunnelClientOptions } from './types';
import { log } from './utils/logger';

export class ConnectionManager {
  private readonly tunnelId: string;
  private readonly metadata?: TunnelClientOptions['metadata'];
  private pingInterval?: NodeJS.Timeout;
  private isStopped = false;

  constructor(options: TunnelClientOptions) {
    this.tunnelId = options.tunnelId;
    this.metadata = options.metadata;
  }

  /**
   * Creates a new tunnel connection record and updates tunnel status
   */
  async createConnection(): Promise<void> {
    try {
      // Get tunnel info first
      const tunnel = await db.query.Tunnels.findFirst({
        where: eq(Tunnels.id, this.tunnelId),
      });

      if (!tunnel) {
        throw new Error(`Tunnel not found for tunnelId: ${this.tunnelId}`);
      }

      // Create connection record
      await db.insert(Connections).values({
        tunnelId: tunnel.id,
        ipAddress: this.metadata?.clientIp ?? '0.0.0.0', // Required field
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
          status: 'active',
          lastConnectionAt: new Date(),
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
        where: eq(Tunnels.id, this.tunnelId),
      });

      if (!tunnel) return;

      // Update tunnel and connection status
      await Promise.all([
        db
          .update(Tunnels)
          .set({
            status: 'active',
            lastConnectionAt: new Date(),
          })
          .where(eq(Tunnels.id, tunnel.id)),
        db
          .update(Connections)
          .set({
            lastPingAt: new Date(),
          })
          .where(
            and(
              eq(Connections.tunnelId, tunnel.id),
              isNull(Connections.disconnectedAt),
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
        where: eq(Tunnels.id, this.tunnelId),
      });

      if (!tunnel) return;

      await Promise.all([
        db
          .update(Tunnels)
          .set({
            status: 'inactive',
            lastConnectionAt: new Date(),
          })
          .where(eq(Tunnels.id, tunnel.id)),
        db
          .update(Connections)
          .set({
            disconnectedAt: new Date(),
          })
          .where(
            and(
              eq(Connections.tunnelId, tunnel.id),
              isNull(Connections.disconnectedAt),
            ),
          ),
      ]);

      log.main('Updated tunnel and connection status on disconnect');
    } catch (error) {
      log.error('Failed to update tunnel status on disconnect:', error);
    }
  }
}
