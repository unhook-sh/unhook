import { useUser } from '@clerk/chrome-extension';
import posthog from 'posthog-js/dist/module.full.no-external';
import { useEffect } from 'react';

// import { PostHogProvider as Provider, usePostHog } from "posthog-js/react";

export function PostHogPageView() {
  useEffect(() => {
    posthog.register({
      domain: globalThis.location.hostname,
      full_url: globalThis.location.href,
    });
  }, []);

  return null;
}

export function PostHogIdentifyUser() {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
      });
    }
  }, [user]);

  return null;
}

// export function PostHogProvider({ children }: PropsWithChildren) {
// useEffect(() => {
posthog.init(process.env.PLASMO_PUBLIC_POSTHOG_KEY || '', {
  // api_host:
  // process.env.PLASMO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  api_host: 'https://app.posthog.com',
  autocapture: true,
  capture_pageview: true,
  disable_session_recording: false,
  loaded: (posthog) => {
    posthog.register({
      domain: globalThis.location.hostname,
      full_url: globalThis.location.href,
    });

    // if (process.env.NODE_ENV === "development") {
    // posthog.debug(false);
    // }
  },
  persistence: 'localStorage',
});

// }, []);

// return <Provider client={posthog as unknown as PostHog}>{children}</Provider>;
// }

// export { usePostHog } from "posthog-js/react";

export { default as posthog } from 'posthog-js/dist/module.full.no-external';
