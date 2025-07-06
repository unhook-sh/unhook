import { createClient } from '@unhook/db/supabase/server';
import { ConnectionManager } from './connection-manager';
import type { WebhookClientOptions } from './types';
import { log } from './utils/logger';
import { WebhookHandler } from './webhook-handler';

export type { WebhookClientOptions } from './types';

/**
 * Starts the webhook client.
 *
 * Connects to Supabase and subscribes to webhook requests.
 * Delivers requests to the local service and updates the response.
 */
export function startWebhookClient(options: WebhookClientOptions): () => void {
  const { port, webhookId, metadata } = options;
  let isStopped = false;

  log.main('Initializing webhook client with options:', {
    port,
    webhookId,
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
        filter: `id=eq.${webhookId}`,
      },
      webhookHandler.handleRequest.bind(webhookHandler),
    )
    .subscribe();

  log.main('Subscribed to webhook requests');

  // Return cleanup function
  return () => {
    if (isStopped) return;
    log.main('Stopping webhook client...');

    isStopped = true;
    subscription.unsubscribe();
    webhookHandler.stop();
    void connectionManager.stop();

    log.main('Webhook client stopped');
  };
}

export * from './config';
export * from './connection-manager';
export * from './types';
export * from './utils/extract-body';
export * from './utils/headers';
export * from './utils/try-decode-base64';
export * from './utils/try-parse-json';
export * from './webhook-handler';
