'use client';

import { useUser } from '@clerk/nextjs';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import posthog from 'posthog-js';
import { PostHogProvider as Provider, usePostHog } from 'posthog-js/react';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';

import { env } from '../env.client';

export function PosthogWebVitals() {
  const posthog = usePostHog();

  useReportWebVitals((metric) => {
    posthog.capture(metric.name, metric);
  });

  return null;
}

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    // Track pageviews
    if (pathname && ph) {
      let url = globalThis.origin + pathname;
      if (searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogIdentifyUser() {
  const user = useUser();

  useEffect(() => {
    if (user.user) {
      posthog.identify(user.user.id, {
        email: user.user.primaryEmailAddress?.emailAddress,
      });
    }
  }, [user]);
  return null;
}
export function PostHogProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      // api_host: "/ingest",
      // Disable automatic pageview capture, as we capture manually
      capture_pageleave: true,
      capture_pageview: false,
      loaded: (posthog) => {
        if (env.NODE_ENV === 'development') posthog.debug(false);
      },
    });
  }, []);

  return <Provider client={posthog}>{children}</Provider>;
}

export { usePostHog } from 'posthog-js/react';
