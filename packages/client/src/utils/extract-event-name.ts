import { tryDecodeBase64 } from './try-decode-base64';

function getNestedField(
  obj: Record<string, unknown>,
  path: string,
): string | null {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, part) => acc && (acc as Record<string, unknown>)[part],
      obj,
    ) as string | null;
}

const knownEventTypeNames = ['event', 'type', 'event_type', 'eventType'];

/**
 * Extracts the event name/type from a webhook payload body.
 *
 * @param body - The raw or base64-encoded JSON body string.
 * @param eventTypeField - Optional custom field name to check first (supports dot notation, e.g. "data.resourceType").
 */
export function extractEventName(
  body?: string | null,
  eventTypeField?: string | null,
): string | null {
  if (!body) return null;

  try {
    const decodedBody = tryDecodeBase64(body);
    const parsedBody = JSON.parse(decodedBody);

    // Check custom field first if provided
    if (eventTypeField) {
      const value = getNestedField(parsedBody, eventTypeField);
      if (typeof value === 'string') {
        return value;
      }
    }

    for (const name of knownEventTypeNames) {
      const value = getNestedField(parsedBody, name);
      if (typeof value === 'string') {
        return value;
      }
    }

    // If no known event type names found, try to extract from the object structure
    if (parsedBody.object && typeof parsedBody.object === 'string') {
      return parsedBody.object;
    }

    return null;
  } catch (error) {
    console.error('Error extracting event name:', error);
    return null;
  }
}
