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
    destination: destinationDef.name,
    url: destinationUrl,
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
  preventDuplicates = false,
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
  preventDuplicates?: boolean;
}) {
  const originRequest = event.originRequest;
  for (const deliveryRule of delivery) {
    const dest = destination.find((t) => t.name === deliveryRule.destination);
    if (!dest) continue;
    if (deliveryRule.source !== '*' && event.source !== deliveryRule.source) {
      capture?.({
        event: 'webhook_event_skipped',
        properties: {
          destination: dest.name,
          eventId: event.id,
          source: event.source,
          webhookId: event.webhookId,
        },
      });
      continue;
    }
    const urlString = getUrlString(dest.url);

    // Check if a request already exists for this event and destination to prevent duplicates
    if (preventDuplicates) {
      try {
        const existingRequest =
          await api.requests.byEventIdAndDestination.query({
            destinationName: dest.name,
            destinationUrl: urlString,
            eventId: event.id,
          });

        if (existingRequest) {
          // Request already exists, skip creation but still call onRequestCreated if provided
          capture?.({
            event: 'webhook_request_duplicate_skipped',
            properties: {
              destination: dest.name,
              eventId: event.id,
              existingRequestId: existingRequest.id,
              source: event.source,
              webhookId: event.webhookId,
            },
          });

          // if (onRequestCreated) {
          //   await onRequestCreated(existingRequest);
          // }
          continue;
        }
      } catch (error) {
        // If we can't check for existing requests, log the error but continue with creation
        console.warn('Failed to check for existing requests:', error);
      }
    }

    capture?.({
      event: isEventRetry ? 'webhook_request_replay' : 'webhook_event_deliver',
      properties: {
        connectionId: connectionId ?? undefined,
        destination: dest.name,
        eventId: event.id,
        isEventRetry,
        method: originRequest.method,
        pingEnabled: pingEnabledFn ? pingEnabledFn(dest) : !!dest.ping,
        source: event.source,
        url: urlString,
        webhookId: event.webhookId,
      },
    });
    const request = await api.requests.create.mutate({
      apiKeyId: event.apiKeyId,
      connectionId: connectionId ?? undefined,
      destination: {
        name: dest.name,
        url: urlString,
      },
      destinationName: dest.name,
      destinationUrl: urlString,
      eventId: event.id,
      responseTimeMs: 0,
      source: event.source,
      status: 'pending',
      timestamp:
        typeof event.timestamp === 'string'
          ? new Date(event.timestamp)
          : event.timestamp,
      webhookId: event.webhookId,
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
  event,
}: {
  request: RequestType;
  event: EventType;
  delivery: WebhookDelivery[];
  destination: WebhookDestination[];
  api: ApiClient;
  capture?: DeliveryCaptureFn;
  onRetryRequest?: (request: RequestType) => Promise<void> | void;
  requestFn?: DeliveryRequestFn;
}) {
  const dest = resolveDestination({
    delivery,
    destination,
    source: request.source,
  });
  if (!dest) return;

  // Get the original request data from the associated event
  const originRequest = event?.originRequest;
  if (!originRequest) {
    throw new Error('No origin request data available - event data not loaded');
  }

  capture?.({
    event: 'webhook_request_received',
    properties: {
      destination: dest.destination,
      eventId: request.eventId,
      method: originRequest.method,
      requestId: request.id,
      source: request.source,
      url: dest.url,
      webhookId: request.webhookId,
    },
  });
  if (request.status === 'pending') {
    try {
      let requestBody: string | undefined;
      if (originRequest.body) {
        try {
          requestBody = Buffer.from(originRequest.body, 'base64').toString(
            'utf-8',
          );
        } catch {
          requestBody = originRequest.body;
        }
      }
      const startTime = Date.now();
      const { host: _host, ...headers } = originRequest.headers;
      const response = await (requestFn
        ? requestFn(dest.url, {
            body: requestBody,
            headers,
            method: originRequest.method,
          })
        : Promise.reject(new Error('No requestFn provided')));

      if (!response) {
        throw new Error('No response received from requestFn');
      }

      const responseText = response.body ? await response.body.text() : '';
      const responseBodyBase64 = Buffer.from(responseText).toString('base64');
      const responseTimeMs = Date.now() - startTime;
      capture?.({
        event: 'webhook_request_completed',
        properties: {
          eventId: request.eventId,
          method: originRequest.method,
          requestId: request.id,
          responseStatus: response.statusCode,
          responseTimeMs,
          webhookId: request.webhookId,
        },
      });
      await api.requests.markCompleted.mutate({
        requestId: request.id,
        response: {
          body: responseBodyBase64,
          headers: Object.fromEntries(
            Object.entries(response.headers).map(([k, v]) => [
              k,
              Array.isArray(v) ? v.join(', ') : v || '',
            ]),
          ),
          status: response.statusCode,
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
          updateLastRequest: true,
          webhookId: request.webhookId,
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
          eventId: request.eventId,
          failedReason,
          method: originRequest.method,
          requestId: request.id,
          webhookId: request.webhookId,
        },
      });
      await api.requests.markFailed.mutate({
        failedReason,
        requestId: request.id,
      });
      if (typeof request.eventId === 'string') {
        const event = await api.events.byId.query({
          id: request.eventId,
        });
        if (event && typeof event.id === 'string') {
          if (event.retryCount < event.maxRetries) {
            await api.events.updateEventStatus.mutate({
              eventId: event.id,
              retryCount: event.retryCount + 1,
              status: 'processing',
            });
            await api.requests.create.mutate({
              apiKeyId: request.apiKeyId ?? undefined,
              destination: {
                name: dest.destination,
                url: dest.url,
              },
              destinationName: dest.destination,
              destinationUrl: dest.url,
              eventId: event.id,
              responseTimeMs: 0,
              source: event.source,
              status: 'pending',
              timestamp: new Date(),
              webhookId: request.webhookId,
            });
            if (onRetryRequest) await onRetryRequest(request);
          } else {
            await api.events.updateEventStatus.mutate({
              eventId: event.id,
              failedReason: `Max retries (${event.maxRetries}) reached. Last error: ${failedReason}`,
              status: 'failed',
            });
          }
        }
      }
    }
  }
}

// Additional helpers for request creation, event replay, etc. will be added here as we refactor from CLI
