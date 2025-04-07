import { PostHog } from 'posthog-node';

import { env } from '../env.server';

export const posthog = new PostHog(env.POSTHOG_KEY, {
  flushAt: 1,
  flushInterval: 0,
  host: env.POSTHOG_HOST,
});
