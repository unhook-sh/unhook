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
          error: `Transformation failed: ${transformResult.error}`,
          eventId: event.id,
          executionTimeMs: Date.now() - startTime,
          originalPayload: event.originRequest.body
            ? JSON.parse(event.originRequest.body)
            : null,
          ruleId: rule.id,
          success: false,
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
        destinationResponse: destinationResult.response,
        error: destinationResult.error,
        eventId: event.id,
        executionTimeMs: Date.now() - startTime,
        originalPayload: event.originRequest.body
          ? JSON.parse(event.originRequest.body)
          : null,
        ruleId: rule.id,
        success: destinationResult.success,
        transformedPayload: transformResult.data,
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
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId: event.id,
        executionTimeMs: Date.now() - startTime,
        originalPayload: event.originRequest.body
          ? JSON.parse(event.originRequest.body)
          : null,
        ruleId: rule.id,
        success: false,
      };
      executions.push(execution);
    }
  }

  return {
    executions,
    success: executions.some((e) => e.success === true),
  };
}
