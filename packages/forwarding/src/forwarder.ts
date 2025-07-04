import type {
  EventType,
  ForwardingDestinationType,
  ForwardingExecutionType,
  ForwardingRuleType,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { sendToDestination } from './destinations';
import { evaluateFilters } from './filters';
import { applyTransformation } from './transformers';
import type { ForwardingContext } from './types';

const log = debug('unhook:forwarding:forwarder');

export interface ForwardingResult {
  success: boolean;
  executions: Partial<ForwardingExecutionType>[];
}

export async function forwardWebhook(
  event: EventType,
  rules: ForwardingRuleType[],
  destinations: Map<string, ForwardingDestinationType>,
): Promise<ForwardingResult> {
  const executions: Partial<ForwardingExecutionType>[] = [];

  // Sort rules by priority (lower numbers first)
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    if (!rule.isActive) {
      continue;
    }

    const startTime = Date.now();
    let execution: Partial<ForwardingExecutionType>;

    try {
      // Get the destination for this rule
      const destination = destinations.get(rule.destinationId);
      if (!destination || !destination.isActive) {
        log(
          `Destination ${rule.destinationId} not found or inactive for rule ${rule.id}`,
        );
        continue;
      }

      // Create the forwarding context
      const context: ForwardingContext = {
        event,
        request: event.originRequest,
        rule,
      };

      // Evaluate filters
      const filterResult = await evaluateFilters(context);
      if (!filterResult.shouldForward) {
        log(`Rule ${rule.id} filtered out: ${filterResult.reason}`);
        continue;
      }

      // Apply transformation
      const transformResult = await applyTransformation(
        rule.transformation ?? '',
        context,
      );
      if (!transformResult.success) {
        execution = {
          ruleId: rule.id,
          eventId: event.id,
          originalPayload: event.originRequest.body
            ? JSON.parse(event.originRequest.body)
            : null,
          success: false,
          error: `Transformation failed: ${transformResult.error}`,
          executionTimeMs: Date.now() - startTime,
        };
        executions.push(execution);
        continue;
      }

      // Send to destination
      const destinationResult = await sendToDestination(
        transformResult.data,
        destination,
      );

      execution = {
        ruleId: rule.id,
        eventId: event.id,
        originalPayload: event.originRequest.body
          ? JSON.parse(event.originRequest.body)
          : null,
        transformedPayload: transformResult.data,
        destinationResponse: destinationResult.response,
        success: destinationResult.success,
        error: destinationResult.error,
        executionTimeMs: Date.now() - startTime,
      };

      executions.push(execution);

      if (destinationResult.success) {
        log(
          `Successfully forwarded event ${event.id} via rule ${rule.id} to ${destination.type}`,
        );
      } else {
        log(
          `Failed to forward event ${event.id} via rule ${rule.id}: ${destinationResult.error}`,
        );
      }
    } catch (error) {
      log(`Error processing rule ${rule.id}:`, error);
      execution = {
        ruleId: rule.id,
        eventId: event.id,
        originalPayload: event.originRequest.body
          ? JSON.parse(event.originRequest.body)
          : null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      };
      executions.push(execution);
    }
  }

  return {
    success: executions.some((e) => e.success === true),
    executions,
  };
}
