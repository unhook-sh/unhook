import type { Context } from '@unhook/api';
import { debug } from '@unhook/logger';
import { UnhookMCPServer } from './server';
import type {
  InitializedNotification,
  JsonRpcRequest,
  JsonRpcResponse,
} from './types';
import { isJsonRpcNotification, isJsonRpcRequest } from './types';

const log = debug('unhook:mcp-sse-transport');

interface SSEMessage {
  endpoint?: string;
  messageId?: number;
  data: unknown;
}

export class MCPSSETransport {
  private server: UnhookMCPServer;
  private encoder = new TextEncoder();
  private sessionInitialized = false;

  constructor(context: Context) {
    this.server = new UnhookMCPServer(context);
  }

  async handleMessage(message: SSEMessage): Promise<SSEMessage | null> {
    log('Received SSE message:', message);

    if (!message.data) {
      return this.createErrorMessage(
        message.messageId,
        -32600,
        'Invalid request: missing data',
      );
    }

    const data = message.data;

    // Handle JSON-RPC requests
    if (isJsonRpcRequest(data)) {
      const response = await this.server.handleRequest(data);
      return {
        messageId: message.messageId,
        data: response,
      };
    }

    // Handle JSON-RPC notifications
    if (isJsonRpcNotification(data)) {
      const notification = data as InitializedNotification;
      if (notification.method === 'notifications/initialized') {
        this.sessionInitialized = true;
        log('Session initialized');
        return null; // No response for notifications
      }
    }

    return this.createErrorMessage(
      message.messageId,
      -32600,
      'Invalid request format',
    );
  }

  formatSSEMessage(message: SSEMessage): string {
    const lines = [
      'event: message',
      `data: ${JSON.stringify(message)}`,
      '',
      '',
    ];
    return lines.join('\n');
  }

  createReadableStream(): ReadableStream<Uint8Array> {
    const encoder = this.encoder;
    const formatSSEMessage = this.formatSSEMessage.bind(this);

    return new ReadableStream({
      start(controller) {
        // Send initial connection message
        const connectionMessage = formatSSEMessage({
          endpoint: '/message',
          data: { type: 'connection', status: 'connected' },
        });
        controller.enqueue(encoder.encode(connectionMessage));
      },
      cancel() {
        log('SSE stream cancelled');
      },
    });
  }

  private createErrorMessage(
    messageId: number | undefined,
    code: number,
    message: string,
  ): SSEMessage {
    const errorResponse: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: messageId || -1,
      error: {
        code,
        message,
      },
    };

    return {
      messageId,
      data: errorResponse,
    };
  }
}
