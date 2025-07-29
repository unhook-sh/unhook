import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@unhook/db/supabase/cli';
import { debug } from '@unhook/logger';
import type * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';
import { env } from '../env';
import type { AuthStore } from './auth.service';

const log = debug('unhook:vscode:realtime');

export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'events' | 'requests';
  record: Record<string, unknown>;
  oldRecord?: Record<string, unknown>;
}

export interface RealtimeServiceOptions {
  authStore: AuthStore;
  onEventReceived: (event: RealtimeEvent) => void;
  onConnectionStateChange?: (connected: boolean) => void;
  onChannelStateChange?: (
    channelType: 'events' | 'requests',
    connected: boolean,
  ) => void;
}

export class RealtimeService implements vscode.Disposable {
  private supabaseClient: ReturnType<typeof createClient> | null = null;
  private eventChannel: RealtimeChannel | null = null;
  private requestChannel: RealtimeChannel | null = null;
  private isConnected = false;
  private eventsConnected = false;
  private requestsConnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY_MS = 5000;
  private currentWebhookId: string | null = null;
  private connectionMonitorInterval: NodeJS.Timeout | null = null;
  private readonly CONNECTION_MONITOR_INTERVAL_MS = 30000; // Check every 30 seconds

  constructor(private options: RealtimeServiceOptions) {
    this.setupAuthListener();
  }

  private setupAuthListener() {
    this.options.authStore.onDidChangeAuth(() => {
      log('Auth state changed, reconnecting realtime');
      this.disconnect();
      if (this.options.authStore.isSignedIn) {
        this.connect();
      }
    });
  }

  public async connect(webhookId?: string): Promise<void> {
    if (!this.options.authStore.isSignedIn) {
      log('Cannot connect: user not signed in');
      return;
    }

    if (this.isConnected && this.currentWebhookId === webhookId) {
      log('Already connected to the same webhook');
      return;
    }

    // Disconnect from previous connection if different webhook
    if (this.isConnected && this.currentWebhookId !== webhookId) {
      this.disconnect();
    }
    if (!this.options.authStore.supabaseToken) {
      log('Cannot connect: no Supabase auth token');
      return;
    }

    // Validate token format
    const token = this.options.authStore.supabaseToken;
    if (!token || token.length < 10) {
      log('Cannot connect: invalid Supabase auth token format', {
        tokenLength: token?.length,
      });
      return;
    }

    try {
      log('Connecting to Supabase realtime', {
        hasAuthToken: !!token,
        webhookId,
      });

      // Create Supabase client with auth token
      this.supabaseClient = createClient({
        authToken: token,
        url: this.getSupabaseUrl(),
      });

      // Wait for connection to be established
      await this.waitForConnection();

      // Ensure authentication is properly set up before subscribing
      if (!this.supabaseClient?.realtime.isConnected()) {
        throw new Error('Supabase realtime connection not established');
      }

      if (webhookId) {
        await this.subscribeToWebhook(webhookId);
      }

      this.isConnected = true;
      this.currentWebhookId = webhookId || null;
      this.reconnectAttempts = 0;

      // Start monitoring connection health
      this.startConnectionMonitoring();

      this.options.onConnectionStateChange?.(true);
      log('Successfully connected to Supabase realtime');
    } catch (error) {
      log('Failed to connect to Supabase realtime', {
        error: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      this.handleConnectionError();
    }
  }

  public async subscribeToWebhook(webhookId: string): Promise<void> {
    if (!this.supabaseClient) {
      log('Cannot subscribe: not connected to Supabase');
      return;
    }

    log('Subscribing to webhook events and requests', { webhookId });

    // Subscribe to events table changes for this webhook
    this.eventChannel = this.supabaseClient
      .channel(`events-${webhookId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          filter: `webhookId=eq.${webhookId}`,
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          const eventId =
            (payload.new as Record<string, unknown>)?.id ||
            (payload.old as Record<string, unknown>)?.id;
          log('Received event change', {
            event: payload.eventType,
            eventId,
          });
          this.options.onEventReceived({
            oldRecord: payload.old as Record<string, unknown>,
            record: payload.new as Record<string, unknown>,
            table: 'events',
            type: payload.eventType,
          });
        },
      )
      .on('system', {}, (payload) => {
        // Only log system events that indicate errors or important state changes
        if (payload.message === ':error_generating_signer') {
          log('Signer generation error detected', {
            authTokenExists: !!this.options.authStore.supabaseToken,
            channelName: `events-${webhookId}`,
            connectionState: this.supabaseClient?.realtime.connectionState(),
            payload,
            webhookId,
          });
        }
      })
      .subscribe((status, error) => {
        const wasConnected = this.eventsConnected;
        this.eventsConnected = status === 'SUBSCRIBED';

        if (error) {
          log('Event channel error details:', {
            error: error.message,
            errorStack: error.stack,
            webhookId,
          });
          this.eventsConnected = false;
        }

        // Notify if connection state changed
        if (wasConnected !== this.eventsConnected) {
          log('Events channel connection state changed', {
            connected: this.eventsConnected,
            webhookId,
          });
          this.options.onChannelStateChange?.('events', this.eventsConnected);
        }
      });

    // Wait a moment for the first subscription to establish
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Subscribe to requests table changes for this webhook
    this.requestChannel = this.supabaseClient
      .channel(`requests-${webhookId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          filter: `webhookId=eq.${webhookId}`,
          schema: 'public',
          table: 'requests',
        },
        (payload) => {
          const requestId =
            (payload.new as Record<string, unknown>)?.id ||
            (payload.old as Record<string, unknown>)?.id;
          log('Received request change', {
            event: payload.eventType,
            requestId,
          });
          this.options.onEventReceived({
            oldRecord: payload.old as Record<string, unknown>,
            record: payload.new as Record<string, unknown>,
            table: 'requests',
            type: payload.eventType,
          });
        },
      )
      .on('system', {}, (payload) => {
        // Only log system events that indicate errors or important state changes
        if (payload.message === ':error_generating_signer') {
          log('Signer generation error detected for requests channel', {
            authTokenExists: !!this.options.authStore.supabaseToken,
            channelName: `requests-${webhookId}`,
            connectionState: this.supabaseClient?.realtime.connectionState(),
            payload,
            webhookId,
          });
        }
      })
      .subscribe((status, error) => {
        const wasConnected = this.requestsConnected;
        this.requestsConnected = status === 'SUBSCRIBED';

        if (error) {
          log('Request channel error details:', {
            error: error.message,
            errorStack: error.stack,
            webhookId,
          });
          this.requestsConnected = false;
        }

        // Notify if connection state changed
        if (wasConnected !== this.requestsConnected) {
          log('Requests channel connection state changed', {
            connected: this.requestsConnected,
            webhookId,
          });
          this.options.onChannelStateChange?.(
            'requests',
            this.requestsConnected,
          );
        }
      });

    log('Successfully subscribed to webhook changes', { webhookId });
  }

  public disconnect(): void {
    log('Disconnecting from Supabase realtime');

    // Stop connection monitoring
    this.stopConnectionMonitoring();

    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Unsubscribe from channels
    if (this.eventChannel) {
      this.supabaseClient?.removeChannel(this.eventChannel);
      this.eventChannel = null;
    }

    if (this.requestChannel) {
      this.supabaseClient?.removeChannel(this.requestChannel);
      this.requestChannel = null;
    }

    // Disconnect from Supabase
    if (this.supabaseClient) {
      this.supabaseClient.realtime.disconnect();
      this.supabaseClient = null;
    }

    this.isConnected = false;
    this.eventsConnected = false;
    this.requestsConnected = false;
    this.currentWebhookId = null;
    this.options.onConnectionStateChange?.(false);
    this.options.onChannelStateChange?.('events', false);
    this.options.onChannelStateChange?.('requests', false);

    log('Disconnected from Supabase realtime');
  }

  private async waitForConnection(): Promise<void> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000); // 10 second timeout

      const checkConnection = () => {
        const isConnected = this.supabaseClient?.realtime.isConnected();

        if (isConnected) {
          clearTimeout(timeout);
          log('Connection established successfully');
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  private handleConnectionError(): void {
    this.isConnected = false;
    this.options.onConnectionStateChange?.(false);

    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`,
      );

      this.reconnectTimeout = setTimeout(() => {
        this.connect(this.currentWebhookId || undefined);
      }, this.RECONNECT_DELAY_MS);
    } else {
      log('Max reconnection attempts reached');
    }
  }

  private startConnectionMonitoring(): void {
    // Stop any existing monitoring
    this.stopConnectionMonitoring();

    this.connectionMonitorInterval = setInterval(() => {
      this.checkConnectionHealth();
    }, this.CONNECTION_MONITOR_INTERVAL_MS);
  }

  private stopConnectionMonitoring(): void {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }
  }

  private checkConnectionHealth(): void {
    if (!this.supabaseClient || !this.isConnected) {
      return;
    }

    const isConnected = this.supabaseClient.realtime.isConnected();

    if (!isConnected && this.isConnected) {
      log('Connection lost, initiating reconnection');
      this.isConnected = false;
      this.options.onConnectionStateChange?.(false);
      this.handleConnectionError();
    } else if (isConnected && !this.isConnected) {
      log('Connection restored');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.options.onConnectionStateChange?.(true);
    }
  }

  private getSupabaseUrl(): string {
    // Use the Supabase URL from environment variables
    if (env.NEXT_PUBLIC_SUPABASE_URL) {
      return env.NEXT_PUBLIC_SUPABASE_URL;
    }

    // Fallback: Get the Supabase URL from config
    const configManager = ConfigManager.getInstance();
    const apiUrl = configManager.getApiUrl();

    // If it's localhost, use the local Supabase URL
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      return 'http://localhost:44321';
    }

    // For production, construct the Supabase URL from the API URL
    // This assumes the API is hosted on the same domain as Supabase
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.hostname}:44321`;
  }

  public getConnectionState(): {
    isConnected: boolean;
    webhookId: string | null;
    eventsConnected: boolean;
    requestsConnected: boolean;
  } {
    return {
      eventsConnected: this.eventsConnected,
      isConnected: this.isConnected,
      requestsConnected: this.requestsConnected,
      webhookId: this.currentWebhookId,
    };
  }

  public async reconnect(): Promise<void> {
    log('Manual reconnection requested');
    this.disconnect();
    await this.connect(this.currentWebhookId || undefined);
  }

  public dispose(): void {
    log('Disposing realtime service');
    this.disconnect();

    // Ensure all monitoring is stopped
    this.stopConnectionMonitoring();
  }
}
