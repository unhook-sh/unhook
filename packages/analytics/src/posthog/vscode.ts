import { debug } from '@unhook/logger';
import { PostHog } from 'posthog-node';
import { env } from '../env.client';

const log = debug('unhook:vscode:posthog');

// We'll initialize PostHog with configuration from the extension
let posthog: PostHog | null = null;
let userId: string | undefined;
let sessionId: string | undefined;
let analyticsEnabled = false;

export function initializePostHog(enabled = true) {
  analyticsEnabled = enabled;

  if (!analyticsEnabled) {
    log('Analytics disabled by user preference');
    return;
  }

  if (!env.NEXT_PUBLIC_POSTHOG_KEY) {
    log('PostHog API key not found in environment, analytics disabled');
    return;
  }

  const isProduction = env.NEXT_PUBLIC_APP_ENV === 'production';

  posthog = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
    defaultOptIn: true,
    flushAt: 1, // Flush immediately for VSCode extension
    flushInterval: 0, // Don't wait to flush
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  log('PostHog initialized', {
    environment: env.NEXT_PUBLIC_APP_ENV,
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
    production: isProduction,
  });
}

export function setUser(user: { id: string; email?: string } | null) {
  if (user) {
    userId = user.id;
    log('User set for analytics', { userId });

    // Identify the user in PostHog
    if (posthog && analyticsEnabled) {
      posthog.identify({
        distinctId: userId,
        properties: {
          email: user.email,
        },
      });
    }
  } else {
    userId = undefined;
    log('User cleared from analytics');
  }
}

export function setSessionId(id: string) {
  sessionId = id;
  log('Session ID set for analytics', { sessionId });
}

interface CaptureOptions {
  distinctId?: string;
  properties?: Record<string, unknown>;
}

export function capture(event: string, options: CaptureOptions = {}) {
  const distinctId = options.distinctId ?? userId ?? sessionId;

  if (!distinctId) {
    log('No distinct ID available for event', { event });
    return;
  }

  const isProduction = env.NEXT_PUBLIC_APP_ENV === 'production';

  if (!isProduction || !posthog || !analyticsEnabled) {
    log('Analytics event (dev mode or disabled)', {
      distinctId,
      event,
      properties: options.properties,
    });
    return;
  }

  posthog.capture({
    distinctId,
    event,
    properties: {
      ...options.properties,
      source: 'vscode-extension',
    },
  });

  log('Analytics event captured', { distinctId, event });
}

export function captureException(
  error: Error,
  context?: Record<string, unknown>,
) {
  const isProduction = env.NEXT_PUBLIC_APP_ENV === 'production';

  if (!isProduction || !posthog || !analyticsEnabled) {
    log('Exception (dev mode or disabled)', { context, error: error.message });
    return;
  }

  const distinctId = userId ?? sessionId;
  if (!distinctId) {
    log('No distinct ID available for exception');
    return;
  }

  posthog.captureException(error, distinctId, {
    ...context,
    source: 'vscode-extension',
  });

  log('Exception captured', { error: error.message });
}

export async function shutdown() {
  if (!posthog) {
    return;
  }

  try {
    await posthog.flush();
    log('PostHog flushed');
  } catch (error) {
    log('Error flushing PostHog', error);
  }

  try {
    await posthog.shutdown();
    log('PostHog shutdown');
  } catch (error) {
    log('Error shutting down PostHog', error);
  }
}

// VSCode specific page view tracking
export function pageView(view: string, properties?: Record<string, unknown>) {
  capture('$pageview', {
    properties: {
      ...properties,
      view,
    },
  });
}
