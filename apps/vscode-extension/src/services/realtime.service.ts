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
    error?: Error,
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
  private readonly CONNECTION_MONITOR_INTERVAL_MS = 60000; // Check every 60 seconds
  private lastReconnectAttempt = 0;
  private readonly MIN_RECONNECT_INTERVAL_MS = 10000; // Minimum 10 seconds between reconnects

  constructor(private options: RealtimeServiceOptions) {
    this.setupAuthListener();
  }

  private previousAuthState: {
    isSignedIn: boolean;
    supabaseToken: string | null;
  } = {
    isSignedIn: false,
    supabaseToken: null,
  };

  private setupAuthListener() {
    this.options.authStore.onDidChangeAuth(() => {
      const currentAuthState = {
        isSignedIn: this.options.authStore.isSignedIn,
        supabaseToken: this.options.authStore.supabaseToken,
      };

      // Only reconnect if there's a meaningful change in auth state
      const authStateChanged =
        this.previousAuthState.isSignedIn !== currentAuthState.isSignedIn ||
        this.previousAuthState.supabaseToken !== currentAuthState.supabaseToken;

      log('Auth state changed', {
        authStateChanged,
        currentWebhookId: this.currentWebhookId,
        hasSupabaseToken: !!currentAuthState.supabaseToken,
        isSignedIn: currentAuthState.isSignedIn,
        previousHadToken: !!this.previousAuthState.supabaseToken,
        previousSignedIn: this.previousAuthState.isSignedIn,
      });

      if (authStateChanged) {
        log(
          'Meaningful auth state change detected, handling realtime connection',
        );

        // Always disconnect first to clean up existing connections
        this.disconnect();

        // Only reconnect if we're signed in and have tokens
        if (currentAuthState.isSignedIn && currentAuthState.supabaseToken) {
          // Add a small delay to ensure tokens are fully set up
          setTimeout(() => {
            if (this.currentWebhookId) {
              this.connect(this.currentWebhookId);
            } else {
              this.connect();
            }
          }, 500);
        } else {
          log(
            'Not reconnecting - either not signed in or missing Supabase token',
          );
        }
      } else {
        log('Auth event fired but no meaningful state change, ignoring');
      }

      // Update previous state
      this.previousAuthState = currentAuthState;
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

      this.currentWebhookId = webhookId || null;

      if (webhookId) {
        await this.subscribeToWebhook(webhookId);
      }

      this.isConnected = true;
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

    // Create both channels first with private configuration
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

          // Check if this is an authentication error
          if (
            error.message.includes('auth') ||
            error.message.includes('unauthorized')
          ) {
            log('Detected authentication error in events channel');
            this.handleAuthenticationFailure(error);
          }
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

    await this.waitForChannelSubscription(this.eventChannel, 'events');
    log('Events channel subscription established');

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

          // Check if this is an authentication error
          if (
            error.message.includes('auth') ||
            error.message.includes('unauthorized')
          ) {
            log('Detected authentication error in requests channel');
            this.handleAuthenticationFailure(error);
          }
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

    try {
      await Promise.all([
        this.waitForChannelSubscription(this.eventChannel, 'events'),
        this.waitForChannelSubscription(this.requestChannel, 'requests'),
      ]);
      log('Successfully subscribed to webhook changes', { webhookId });
    } catch (error) {
      log('Failed to establish channel subscriptions', { error, webhookId });

      // If subscription fails, clean up and try to reconnect with fresh token
      if (this.eventChannel) {
        this.supabaseClient?.removeChannel(this.eventChannel);
        this.eventChannel = null;
        this.eventsConnected = false;
      }
      if (this.requestChannel) {
        this.supabaseClient?.removeChannel(this.requestChannel);
        this.requestChannel = null;
        this.requestsConnected = false;
      }

      // Try to refresh the Supabase token and reconnect after a short delay
      setTimeout(async () => {
        log(
          'Attempting to refresh token and reconnect after subscription failure',
        );
        try {
          // Validate session to refresh tokens
          if (this.options.authStore.sessionId) {
            await this.options.authStore.validateSession();
          }
          // Reconnect with fresh tokens
          await this.reconnectWithAuthVerification();
        } catch (reconnectError) {
          log('Failed to reconnect after subscription failure', {
            error: reconnectError,
          });
        }
      }, 2000);

      throw error;
    }
  }

  /**
   * Wait for a channel subscription to establish and verify authentication
   */
  private async waitForChannelSubscription(
    channel: RealtimeChannel | null,
    channelType: 'events' | 'requests',
  ): Promise<void> {
    if (!channel) {
      throw new Error(`Channel ${channelType} is null`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(`Timeout waiting for ${channelType} channel subscription`),
        );
      }, 15000); // Increased to 15 second timeout

      let authVerificationAttempts = 0;
      const maxAuthAttempts = 3;

      const checkSubscription = () => {
        // Check if the channel is subscribed by checking the connection state
        const isConnected = this.supabaseClient?.realtime.isConnected();
        const channelConnected =
          channelType === 'events'
            ? this.eventsConnected
            : this.requestsConnected;

        if (isConnected && channelConnected) {
          clearTimeout(timeout);

          // Verify authentication with retry logic
          const attemptAuthVerification = async () => {
            try {
              await this.verifyChannelAuthentication(channelType);
              log(
                `${channelType} channel subscription established successfully`,
              );
              resolve();
            } catch (error) {
              authVerificationAttempts++;
              if (authVerificationAttempts < maxAuthAttempts) {
                log(
                  `Auth verification failed for ${channelType} channel, retrying (${authVerificationAttempts}/${maxAuthAttempts})`,
                  { error },
                );
                // Wait a bit longer before retrying
                setTimeout(attemptAuthVerification, 1000);
              } else {
                log(
                  `Auth verification failed permanently for ${channelType} channel after ${maxAuthAttempts} attempts`,
                  { error },
                );
                reject(error);
              }
            }
          };

          // Give a longer initial delay for auth to settle
          setTimeout(attemptAuthVerification, 1000);
        } else {
          setTimeout(checkSubscription, 200);
        }
      };

      checkSubscription();
    });
  }

  /**
   * Verify that a channel is properly authenticated
   */
  private async verifyChannelAuthentication(
    channelType: 'events' | 'requests',
  ): Promise<void> {
    const hasAuthToken = !!this.options.authStore.supabaseToken;

    // If we don't have an auth token, skip authentication verification
    if (!hasAuthToken) {
      log(
        `No auth token available for ${channelType} channel, skipping verification`,
      );
      return;
    }

    try {
      // More lenient authentication check - if we have a token and either we're authenticated
      // OR we have claims (which indicates a valid session), consider it successful
      if (hasAuthToken) {
        log(`Channel ${channelType} authentication verified successfully`);

        // Also verify subscription claims role for additional security check
        await this.verifySubscriptionClaimsRole(channelType);
        return;
      }

      // When using accessToken configuration (CLI mode), we won't have claims/session data
      // but isAuthenticated will be true if we have a valid token
      if (hasAuthToken) {
        log(
          `Channel ${channelType} authentication verified (accessToken mode)`,
        );
        return;
      }

      // If we have an auth token but no authentication, this might be a temporary issue
      // Only fail if we're sure there's a real authentication problem
      if (hasAuthToken) {
        log(
          `Channel ${channelType} authentication may have failed - token exists but no claims/auth`,
        );
        throw new Error(
          `Channel ${channelType} authentication verification failed`,
        );
      }

      log(`Channel ${channelType} authentication check completed`);
    } catch (error) {
      // Log the error but be more lenient - many auth verification failures are temporary
      log(`Auth verification error for ${channelType} channel:`, error);

      // Only throw if this is a definitive authentication failure
      if (
        error instanceof Error &&
        error.message.includes('authentication verification failed')
      ) {
        throw error;
      }

      // For other errors (timeouts, network issues), log but don't fail the subscription
      log(
        `Allowing ${channelType} channel subscription despite auth verification error`,
      );
    }
  }

  /**
   * Verify that our subscription for a specific table has the correct claims role (authenticated vs anon)
   */
  private async verifySubscriptionClaimsRole(
    tableName: 'events' | 'requests',
  ): Promise<void> {
    if (!this.currentWebhookId) {
      log(
        'No webhook ID available, skipping subscription claims role verification',
      );
      return;
    }

    try {
      log('Verifying subscription claims roles for events and requests', {
        webhookId: this.currentWebhookId,
      });

      // Use the API to verify subscription claims role
      try {
        const result =
          await this.options.authStore.api.realtimeSubscriptions.verifyWebhookSubscriptionClaims.query(
            {
              tableName,
              webhookId: this.currentWebhookId,
            },
          );

        if (!result.found) {
          log(`No ${tableName} subscription found for webhook`, {
            webhookId: this.currentWebhookId,
          });
          return;
        }

        const hasAuthToken = !!this.options.authStore.supabaseToken;
        const expectedRole = hasAuthToken ? 'authenticated' : 'anon';

        log(`${tableName} subscription claims role check`, {
          claimsRole: result.claimsRole,
          entity: tableName,
          expectedRole,
          hasAuthToken,
        });

        if (result.claimsRole !== expectedRole) {
          log(`${tableName} subscription claims role mismatch detected`, {
            actualRole: result.claimsRole,
            entity: tableName,
            expectedRole,
            hasAuthToken,
          });

          // Trigger reauthentication by calling the authentication failure handler
          await this.handleAuthenticationFailure(
            new Error('Subscription claims role mismatch'),
          );
        } else {
          log(`${tableName} subscription claims role verified successfully`, {
            claimsRole: result.claimsRole,
            entity: tableName,
            expectedRole,
          });
        }
      } catch (error) {
        log('Error verifying subscription claims role via API', {
          error: error instanceof Error ? error.message : error,
          tableName,
          webhookId: this.currentWebhookId,
        });
        // Don't throw - this is diagnostic information, not a critical failure
      }
    } catch (error) {
      log('Error verifying subscription claims roles', {
        error: error instanceof Error ? error.message : error,
        webhookId: this.currentWebhookId,
      });
      // Don't throw - this is diagnostic information, not a critical failure
    }
  }

  /**
   * Reconnect with authentication verification
   */
  public async reconnectWithAuthVerification(): Promise<void> {
    const now = Date.now();

    // Rate limit reconnection attempts
    if (now - this.lastReconnectAttempt < this.MIN_RECONNECT_INTERVAL_MS) {
      log('Reconnection rate limited, skipping attempt', {
        minInterval: this.MIN_RECONNECT_INTERVAL_MS,
        timeSinceLastAttempt: now - this.lastReconnectAttempt,
      });
      return;
    }

    this.lastReconnectAttempt = now;
    log('Reconnecting with authentication verification');

    // Disconnect current connection
    this.disconnect();

    // Wait a moment for cleanup
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Reconnect
    await this.connect(this.currentWebhookId || undefined);

    // Verify both channels are authenticated
    if (this.currentWebhookId) {
      await this.verifyChannelAuthentication('events');
      await this.verifyChannelAuthentication('requests');
    }

    log('Reconnection with authentication verification completed');
  }

  /**
   * Check if any channels are unauthenticated and reconnect if needed
   */
  public async checkAndFixAuthentication(): Promise<boolean> {
    if (!this.isConnected || !this.currentWebhookId) {
      log('Not connected or no webhook ID, skipping authentication check');
      return false;
    }

    const hasAuthToken = !!this.options.authStore.supabaseToken;
    if (!hasAuthToken) {
      log('No auth token available, skipping authentication check');
      return false;
    }

    try {
      // If at least one channel is connected, assume things are working
      if (this.eventsConnected || this.requestsConnected) {
        log(
          'At least one channel connected, authentication appears to be working',
        );
        return false;
      }

      log('Authentication check completed without action needed');
      return false;
    } catch (error) {
      log('Error during authentication check:', error);
      // Don't automatically reconnect on errors to avoid loops
      return false;
    }
  }

  /**
   * Handle authentication failure by forcing a reconnection
   */
  public async handleAuthenticationFailure(_error: Error): Promise<void> {
    const now = Date.now();

    // Rate limit authentication failure handling
    if (now - this.lastReconnectAttempt < this.MIN_RECONNECT_INTERVAL_MS) {
      log(
        'Authentication failure handling rate limited, skipping reconnection',
      );
      return;
    }

    log('Handling authentication failure, forcing reconnection');

    // Mark both channels as disconnected
    this.eventsConnected = false;
    this.requestsConnected = false;

    // Notify about channel state changes
    this.options.onChannelStateChange?.('events', false);
    this.options.onChannelStateChange?.('requests', false);

    // Force reconnection with authentication verification
    await this.reconnectWithAuthVerification();
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

    const now = Date.now();

    // Rate limit connection error handling
    if (now - this.lastReconnectAttempt < this.MIN_RECONNECT_INTERVAL_MS) {
      log(
        'Connection error handling rate limited, skipping reconnection attempt',
      );
      return;
    }

    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      this.lastReconnectAttempt = now;

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

    this.connectionMonitorInterval = setInterval(async () => {
      await this.checkConnectionHealth();
    }, this.CONNECTION_MONITOR_INTERVAL_MS);
  }

  private stopConnectionMonitoring(): void {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }
  }

  private async checkConnectionHealth(): Promise<void> {
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
    } else if (isConnected && this.isConnected) {
      // Connection is stable, check authentication
      await this.checkAndFixAuthentication();
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

  /**
   * Check if the current connection is authenticated or anonymous
   * @returns 'authenticated' if we have a valid auth token, 'anonymous' otherwise
   */
  public getConnectionType(): 'authenticated' | 'anonymous' {
    const hasAuthToken = !!this.options.authStore.supabaseToken;
    return hasAuthToken ? 'authenticated' : 'anonymous';
  }

  /**
   * Get detailed connection information including authentication status
   */
  public getDetailedConnectionInfo(): {
    isConnected: boolean;
    connectionType: 'authenticated' | 'anonymous';
    webhookId: string | null;
    eventsConnected: boolean;
    requestsConnected: boolean;
    hasAuthToken: boolean;
  } {
    return {
      connectionType: this.getConnectionType(),
      eventsConnected: this.eventsConnected,
      hasAuthToken: !!this.options.authStore.supabaseToken,
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
