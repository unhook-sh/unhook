import type { EventType, EventTypeWithRequest } from '@unhook/db/schema';

/**
 * Get the display text for a source, showing the source URL when source is '*'
 */
export function getSourceDisplayText(
  event: EventType | EventTypeWithRequest,
): string {
  if (event.source === '*') {
    // When source is '*', show the source URL instead
    return event.originRequest?.sourceUrl || 'Unknown Source';
  }
  return event.source || 'Unknown Source';
}

/**
 * Get the display text for a source string, showing a fallback when source is '*'
 */
export function getSourceDisplayTextFromString(
  source: string,
  fallbackUrl?: string,
): string {
  if (source === '*') {
    return fallbackUrl || 'Unknown Source';
  }
  return source || 'Unknown Source';
}
