'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { PropsWithChildren } from 'react';

import { env } from './env.client';
import { PostHogIdentifyUser } from './posthog/client';
import { WebVitals } from './web-vitals';

const isProduction = env.NEXT_PUBLIC_APP_ENV === 'production';

export function AnalyticsProviders(
  props: PropsWithChildren & { identifyUser?: boolean },
) {
  return (
    <>
      {isProduction && (
        <>
          {props.identifyUser && <PostHogIdentifyUser />}
          <WebVitals />
          {props.children}
          <Analytics />
          <SpeedInsights />
        </>
      )}
      {!isProduction && props.children}
    </>
  );
}
