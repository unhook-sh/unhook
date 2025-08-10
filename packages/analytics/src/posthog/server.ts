import { PostHog } from 'posthog-node';

import { env } from '../env.server';

class PostHogServer {
  private static instance: PostHog | null = null;

  private constructor() {}

  public static getInstance(): PostHog {
    if (!PostHogServer.instance) {
      PostHogServer.instance = new PostHog(env.POSTHOG_KEY, {
        flushAt: 1,
        flushInterval: 0,
        host: env.POSTHOG_HOST,
      });
    }
    return PostHogServer.instance;
  }
}

export const posthog = PostHogServer.getInstance();
