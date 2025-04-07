import type { Callback, Context, Handler } from 'aws-lambda';

import { posthog } from './server';

/**
 * Wraps an AWS Lambda handler to ensure proper shutdown of services
 * like PostHog before the Lambda execution ends
 */
export function withPosthog<TEvent = unknown, TResult = unknown>(
  handler: Handler<TEvent, TResult>,
): Handler<TEvent, TResult> {
  return async (
    event: TEvent,
    context: Context,
    callback: Callback<TResult>,
  ): Promise<TResult> => {
    try {
      return handler(event, context, callback) as TResult;
    } finally {
      await posthog.shutdown();
    }
  };
}
