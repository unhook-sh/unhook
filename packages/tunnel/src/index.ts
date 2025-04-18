import { createClient } from '@unhook/db/supabase/server';
import { ConnectionManager } from './connection-manager';
import type { TunnelClientOptions } from './types';
import { log } from './utils/logger';
import { WebhookHandler } from './webhook-handler';

export type { TunnelClientOptions } from './types';

/**
 * Starts the tunnel client.
 *
 * Connects to Supabase and subscribes to webhook requests.
 * Forwards requests to the local service and updates the response.
 */
export function startTunnelClient(options: TunnelClientOptions): () => void {
  const { port, tunnelId, metadata } = options;
  let isStopped = false;

  log.main('Initializing tunnel client with options:', {
    port,
    tunnelId,
    metadata,
  });

  // Initialize connection manager and webhook handler
  const connectionManager = new ConnectionManager(options);
  const webhookHandler = new WebhookHandler({ port });

  // Initialize Supabase client for subscriptions
  const subscriptionClient = createClient();
  log.main('Connected to Supabase');

  // Create initial connection record and start pinging
  void connectionManager.createConnection();
  connectionManager.startPinging();

  // Subscribe to new webhook requests
  const subscription = subscriptionClient
    .channel('webhook-requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'requests',
        filter: `id=eq.${tunnelId}`,
      },
      webhookHandler.handleRequest.bind(webhookHandler),
    )
    .subscribe();

  log.main('Subscribed to webhook requests');

  // Return cleanup function
  return () => {
    if (isStopped) return;
    log.main('Stopping tunnel client...');

    isStopped = true;
    subscription.unsubscribe();
    webhookHandler.stop();
    void connectionManager.stop();

    log.main('Tunnel client stopped');
  };
}

export * from './utils/headers';
export * from './types';
export * from './webhook-handler';
export * from './connection-manager';
export * from './config';
