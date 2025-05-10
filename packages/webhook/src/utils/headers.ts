/**
 * Configuration for header filtering
 */
export interface HeaderFilterConfig {
  /**
   * Only store these headers (case-insensitive)
   */
  allowList?: string[];

  /**
   * Never store these headers (case-insensitive)
   */
  blockList?: string[];

  /**
   * Replace these header values with "[REDACTED]" (case-insensitive)
   */
  sensitiveHeaders?: string[];
}

/**
 * Filters and processes headers based on configuration
 * - Applies allow list filtering
 * - Applies block list filtering
 * - Redacts sensitive header values
 */
export function filterHeaders(
  headers: Record<string, string>,
  config: HeaderFilterConfig,
): Record<string, string> {
  const result: Record<string, string> = {};

  // Convert all header names to lowercase for case-insensitive comparison
  const allowList = config.allowList?.map((h) => h.toLowerCase());
  const blockList = config.blockList?.map((h) => h.toLowerCase());
  const sensitiveHeaders = config.sensitiveHeaders?.map((h) => h.toLowerCase());

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    // Skip if not in allowList (when defined)
    if (allowList && !allowList.includes(lowerKey)) continue;

    // Skip if in blockList
    if (blockList?.includes(lowerKey)) continue;

    // Redact sensitive headers
    if (sensitiveHeaders?.includes(lowerKey)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  }

  return result;
}
