import { PostHog } from 'posthog-node';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';

import { debug } from '@unhook/logger';
import { env } from '~/env';
import { useAuthStore } from '~/stores/auth-store';
import { useCliStore } from '~/stores/cli-store';
import { useRouterStore } from '~/stores/router-store';

const log = debug('unhook:cli:posthog');

// // Keep a reference to the original PostHog instance
const posthog = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
  host: env.NEXT_PUBLIC_POSTHOG_HOST,
  // flushAt: 1, // Flush immediately
  // defaultOptIn: true,
  // flushInterval: 0, // Don't wait to flush
});

export function capture(
  event: Partial<Pick<Parameters<PostHog['capture']>[0], 'distinctId'>> &
    Omit<Parameters<PostHog['capture']>[0], 'distinctId'>,
) {
  const { user, sessionId } = useAuthStore.getState();
  const userId = user?.id ?? sessionId;

  if (!userId) {
    return;
  }
  const path = useRouterStore.getState().currentPath;

  posthog.capture({
    distinctId: event.distinctId ?? userId,
    ...event,
    properties: {
      ...event.properties,
      $pathname: path,
    },
  });
}

export function captureException(error: Error) {
  const user = useAuthStore.getState().user;
  const sessionId = useAuthStore.getState().sessionId;
  const userId = user?.id ?? sessionId;
  const path = useRouterStore.getState().currentPath;

  posthog.captureException(error, userId, {
    $pathname: path,
  });
}

export async function shutdown() {
  try {
    await posthog.flush();
  } catch (error) {
    log('Error flushing PostHog', error);
  }
  try {
    await posthog.shutdown();
  } catch (error) {
    log('Error shutting down PostHog', error);
  }
}

export function PostHogPageView() {
  const path = useRouterStore.use.currentPath();
  const user = useAuthStore.use.user();
  const sessionId = useAuthStore.use.sessionId();
  const userId = user?.id ?? sessionId;

  useEffect(() => {
    // Track pageviews
    if (path && userId) {
      posthog.capture({
        distinctId: userId,
        event: '$pageview',
        properties: {
          $pathname: path,
        },
      });
    }
  }, [path, userId]);

  return null;
}

export function PostHogIdentifyUser() {
  const user = useAuthStore.use.user();
  const version = useCliStore.use.version();
  const path = useRouterStore.use.currentPath();
  const sessionId = useAuthStore.use.sessionId();
  const userId = user?.id ?? sessionId;
  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (userId) {
      posthog.identify({
        distinctId: userId,
        properties: {
          email,
          version,
          $pathname: path,
        },
      });

      if (sessionId) {
        posthog.alias({
          distinctId: userId,
          alias: sessionId,
        });
      }
    }
  }, [userId, email, version, path, sessionId]);

  return null;
}

export function PostHogOptIn({
  children,
  telemetry,
}: PropsWithChildren<{ telemetry?: boolean }>) {
  useEffect(() => {
    if (telemetry) {
      posthog.optIn();
    } else {
      posthog.optOut();
    }
  }, [telemetry]);

  return <>{children}</>;
}
