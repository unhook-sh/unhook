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

export function tryDecodeBase64(str: string): string {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

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
