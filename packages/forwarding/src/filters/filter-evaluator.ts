import { debug } from '@unhook/logger';
import { get } from 'lodash-es';
import { transformWithJavaScript } from '../transformers/javascript-transformer';
import type { FilterResult, ForwardingContext } from '../types';

const log = debug('unhook:forwarding:filter-evaluator');

export async function evaluateFilters(
  context: ForwardingContext,
): Promise<FilterResult> {
  const { filters } = context.rule;

  if (!filters || Object.keys(filters).length === 0) {
    // No filters configured, forward everything
    return { shouldForward: true };
  }

  try {
    // Check event name filters
    if (filters.eventNames && filters.eventNames.length > 0) {
      const eventName = extractEventName(context);
      if (!filters.eventNames.includes(eventName)) {
        return {
          reason: `Event name "${eventName}" not in allowed list`,
          shouldForward: false,
        };
      }
    }

    // Check HTTP method filters
    if (filters.methods && filters.methods.length > 0) {
      const method = context.request.method.toUpperCase();
      const allowedMethods = filters.methods.map((m) => m.toUpperCase());
      if (!allowedMethods.includes(method)) {
        return {
          reason: `HTTP method "${method}" not in allowed list`,
          shouldForward: false,
        };
      }
    }

    // Check path pattern filters
    if (filters.pathPatterns && filters.pathPatterns.length > 0) {
      const path = new URL(context.request.sourceUrl).pathname;
      const matchesPattern = filters.pathPatterns.some((pattern) => {
        try {
          const regex = new RegExp(pattern);
          return regex.test(path);
        } catch (error) {
          log(`Invalid regex pattern: ${pattern}`, error);
          return false;
        }
      });

      if (!matchesPattern) {
        return {
          reason: `Path "${path}" does not match any allowed patterns`,
          shouldForward: false,
        };
      }
    }

    // Check header filters
    if (filters.headers && Object.keys(filters.headers).length > 0) {
      for (const [headerName, expectedValue] of Object.entries(
        filters.headers,
      )) {
        const actualValue = context.request.headers[headerName.toLowerCase()];

        if (!actualValue) {
          return {
            reason: `Required header "${headerName}" not found`,
            shouldForward: false,
          };
        }

        const expectedValues = Array.isArray(expectedValue)
          ? expectedValue
          : [expectedValue];
        if (!expectedValues.includes(String(actualValue))) {
          return {
            reason: `Header "${headerName}" value "${actualValue}" not in allowed list`,
            shouldForward: false,
          };
        }
      }
    }

    // Check custom JavaScript filter
    if (filters.customFilter && filters.customFilter.trim().length > 0) {
      const filterCode = `
        function transform(data) {
          const shouldForward = (${filters.customFilter});
          return { shouldForward };
        }
      `;

      const result = await transformWithJavaScript(filterCode, context);

      if (!result.success) {
        log('Custom filter evaluation failed:', result.error);
        return {
          reason: `Custom filter error: ${result.error}`,
          shouldForward: false,
        };
      }

      const filterResult = result.data as { shouldForward?: boolean };
      if (!filterResult.shouldForward) {
        return {
          reason: 'Custom filter returned false',
          shouldForward: false,
        };
      }
    }

    // All filters passed
    return { shouldForward: true };
  } catch (error) {
    log('Filter evaluation error:', error);
    return {
      reason: error instanceof Error ? error.message : 'Unknown filter error',
      shouldForward: false,
    };
  }
}

function extractEventName(
  context: ForwardingContext,
  eventTypeField?: string,
): string {
  try {
    if (context.request.body) {
      const body = JSON.parse(context.request.body);

      // Check custom field first if provided
      if (eventTypeField && get(body, eventTypeField) !== undefined) {
        return String(body[eventTypeField]);
      }

      // Common event name fields in webhooks
      const eventName =
        body.type ||
        body.event ||
        body.event_type ||
        body.action ||
        body.eventName ||
        body.event_name ||
        body.name;

      if (eventName) {
        return String(eventName);
      }
    }
  } catch {
    // Failed to parse body, fall back to path
  }

  // Try to extract from path (e.g., /webhooks/stripe/payment.succeeded)
  const path = new URL(context.request.sourceUrl).pathname;
  const pathParts = path.split('/');
  return pathParts.at(-1) || 'unknown';
}
