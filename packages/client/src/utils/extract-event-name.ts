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

export function extractEventName(body?: string | null): string | null {
  if (!body) return null;
  const decodedBody = tryDecodeBase64(body);
  const parsedBody = JSON.parse(decodedBody);
  for (const name of knownEventTypeNames) {
    const value = getNestedField(parsedBody, name);
    if (typeof value === 'string') {
      return value;
    }
  }
  return null;
}
