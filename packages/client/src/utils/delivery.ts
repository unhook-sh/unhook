import type { ApiClient } from '@unhook/api/client';
import type { EventType, RequestType } from '@unhook/db/schema';
// Shared delivery logic for resolving destinations and creating requests for all environments
import type {
  RemotePatternSchema,
  WebhookDelivery,
  WebhookDestination,
} from '../config';

/**
 * Converts a string, URL, or RemotePatternSchema to a URL string
 */
export function getUrlString(url: string | URL | RemotePatternSchema): string {
  if (typeof url === 'string') return url;
  if (typeof URL !== 'undefined' && url instanceof URL) return url.toString();
  if (
    typeof url === 'object' &&
    url !== null &&
    'hostname' in url &&
    typeof (url as RemotePatternSchema).hostname === 'string'
  ) {
    const {
      protocol = 'http',
      hostname,
      port,
      pathname = '',
      search = '',
    } = url as RemotePatternSchema;
    return `${protocol}://${hostname}${port ? `:${port}` : ''}${pathname}${search}`;
  }
  return '';
}

/**
 * Resolves the destination for a given source using delivery rules and destination definitions
 */
export function resolveDestination({
  source,
  delivery,
  destination,
}: {
  source: string;
  delivery: WebhookDelivery[];
  destination: WebhookDestination[];
}): { url: string; destination: string } | null {
  const matchingDeliver = delivery.find(
    (rule) => rule.source === '*' || rule.source === source,
  );
  if (!matchingDeliver) {
    return null;
  }
  const destinationDef = (destination ?? []).find(
    (t) => t.name === matchingDeliver.destination,
  );
  if (!destinationDef || !destinationDef.url) {
    return null;
  }
  const destinationUrl = getUrlString(destinationDef.url);
  return {
    url: destinationUrl,
    destination: destinationDef.name,
  };
}

export type DeliveryRequestFn = (
  url: string,
  options: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{
  body: { text: () => Promise<string> };
  statusCode: number;
  headers: Record<string, string | string[]>;
}>;

export type DeliveryCaptureFn = (event: {
  event: string;
  properties: Record<string, unknown>;
}) => void;

/**
 * Creates requests for all destinations for a given event.
 *
 * @param params - All required data and dependencies
 */
export async function createRequestsForEventToAllDestinations({
  event,
  delivery,
  destination,
  api,
  connectionId,
  isEventRetry = false,
  pingEnabledFn,
  capture,
  onRequestCreated,
}: {
  event: EventType;
  delivery: WebhookDelivery[];
  destination: WebhookDestination[];
  api: ApiClient;
  connectionId?: string | null;
  isEventRetry?: boolean;
  pingEnabledFn?: (destination: WebhookDestination) => boolean;
  capture?: DeliveryCaptureFn;
  onRequestCreated?: (request: RequestType) => Promise<void> | void;
}) {
  const originRequest = event.originRequest;
  for (const deliveryRule of delivery) {
    const dest = destination.find((t) => t.name === deliveryRule.destination);
    if (!dest) continue;
    if (deliveryRule.source !== '*' && event.source !== deliveryRule.source) {
      capture?.({
        event: 'webhook_event_skipped',
        properties: {
          eventId: event.id,
          webhookId: event.webhookId,
          source: event.source,
          destination: dest.name,
        },
      });
      continue;
    }
    const urlString = getUrlString(dest.url);
    capture?.({
      event: isEventRetry ? 'webhook_request_replay' : 'webhook_event_deliver',
      properties: {
        eventId: event.id,
        webhookId: event.webhookId,
        method: originRequest.method,
        connectionId: connectionId ?? undefined,
        pingEnabled: pingEnabledFn ? pingEnabledFn(dest) : !!dest.ping,
        isEventRetry,
        source: event.source,
        destination: dest.name,
        url: urlString,
      },
    });
    const request = await api.requests.create.mutate({
      webhookId: event.webhookId,
      eventId: event.id,
      apiKey: event.apiKey ?? undefined,
      connectionId: connectionId ?? undefined,
      request: originRequest,
      source: event.source,
      destination: {
        name: dest.name,
        url: urlString,
      },
      timestamp:
        typeof event.timestamp === 'string'
          ? new Date(event.timestamp)
          : event.timestamp,
      status: 'pending',
      responseTimeMs: 0,
    });
    if (typeof event.webhookId === 'string') {
      await api.webhooks.updateStats.mutate({ webhookId: event.webhookId });
    }
    if (request && onRequestCreated) {
      await onRequestCreated(request);
    }
  }
}

/**
 * Handles a pending webhook request, delivering it to the destination and updating status.
 *
 * @param params - All required data and dependencies
 */
export async function handlePendingRequest({
  request,
  delivery,
  destination,
  api,
  capture,
  onRetryRequest,
  requestFn,
}: {
  request: RequestType;
  delivery: WebhookDelivery[];
  destination: WebhookDestination[];
  api: ApiClient;
  capture?: DeliveryCaptureFn;
  onRetryRequest?: (request: RequestType) => Promise<void> | void;
  requestFn?: DeliveryRequestFn;
}) {
  const dest = resolveDestination({
    source: request.source,
    delivery,
    destination,
  });
  if (!dest) return;
  capture?.({
    event: 'webhook_request_received',
    properties: {
      requestId: request.id,
      webhookId: request.webhookId,
      eventId: request.eventId,
      method: request.request.method,
      source: request.source,
      destination: dest.destination,
      url: dest.url,
    },
  });
  if (request.status === 'pending') {
    try {
      let requestBody: string | undefined;
      if (request.request.body) {
        try {
          requestBody = Buffer.from(request.request.body, 'base64').toString(
            'utf-8',
          );
        } catch {
          requestBody = request.request.body;
        }
      }
      const startTime = Date.now();
      const { host, ...headers } = request.request.headers;
      const response = await (requestFn
        ? requestFn(dest.url, {
            method: request.request.method,
            headers,
            body: requestBody,
          })
        : Promise.reject(new Error('No requestFn provided')));
      const responseText = await response.body.text();
      const responseBodyBase64 = Buffer.from(responseText).toString('base64');
      const responseTimeMs = Date.now() - startTime;
      capture?.({
        event: 'webhook_request_completed',
        properties: {
          requestId: request.id,
          webhookId: request.webhookId,
          eventId: request.eventId,
          method: request.request.method,
          responseStatus: response.statusCode,
          responseTimeMs,
        },
      });
      await api.requests.markCompleted.mutate({
        requestId: request.id,
        response: {
          status: response.statusCode,
          headers: Object.fromEntries(
            Object.entries(response.headers).map(([k, v]) => [
              k,
              Array.isArray(v) ? v.join(', ') : v || '',
            ]),
          ),
          body: responseBodyBase64,
        },
        responseTimeMs,
      });
      if (typeof request.eventId === 'string') {
        await api.events.updateEventStatus.mutate({
          eventId: request.eventId,
          status: 'completed',
        });
      }
      if (typeof request.webhookId === 'string') {
        await api.webhooks.updateStats.mutate({
          webhookId: request.webhookId,
          updateLastRequest: true,
        });
      }
    } catch (error) {
      const failedReason =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while delivering request';
      capture?.({
        event: 'webhook_request_failed',
        properties: {
          requestId: request.id,
          webhookId: request.webhookId,
          eventId: request.eventId,
          method: request.request.method,
          failedReason,
        },
      });
      await api.requests.markFailed.mutate({
        requestId: request.id,
        failedReason,
      });
      if (typeof request.eventId === 'string') {
        const event = await api.events.byId.query({
          id: request.eventId,
        });
        if (event && typeof event.id === 'string') {
          if (event.retryCount < event.maxRetries) {
            await api.events.updateEventStatus.mutate({
              eventId: event.id,
              status: 'processing',
              retryCount: event.retryCount + 1,
            });
            await api.requests.create.mutate({
              webhookId: request.webhookId,
              eventId: event.id,
              apiKey: request.apiKey ?? undefined,
              source: event.source,
              destination: {
                name: dest.destination,
                url: dest.url,
              },
              request: event.originRequest,
              status: 'pending',
              timestamp: new Date(),
              responseTimeMs: 0,
            });
            if (onRetryRequest) await onRetryRequest(request);
          } else {
            await api.events.updateEventStatus.mutate({
              eventId: event.id,
              status: 'failed',
              failedReason: `Max retries (${event.maxRetries}) reached. Last error: ${failedReason}`,
            });
          }
        }
      }
    }
  }
}

// Additional helpers for request creation, event replay, etc. will be added here as we refactor from CLI
