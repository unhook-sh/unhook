'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { PropsWithChildren } from 'react';

import { env } from './env.client';
import { WebVitals } from './nextjs/web-vitals';
import {
  PostHogIdentifyUser,
  PostHogPageView,
  PostHogProvider,
  PosthogWebVitals,
} from './posthog/client';

const isProduction = env.NEXT_PUBLIC_APP_ENV === 'production';

export function AnalyticsProviders(
  props: PropsWithChildren & { identifyUser?: boolean },
) {
  return (
    <>
      {isProduction && (
        <PostHogProvider>
          <PosthogWebVitals />
          <PostHogPageView />
          {props.identifyUser && <PostHogIdentifyUser />}
          <WebVitals />
          {props.children}
          <Analytics />
          <SpeedInsights />
        </PostHogProvider>
      )}
      {!isProduction && props.children}
    </>
  );
}
