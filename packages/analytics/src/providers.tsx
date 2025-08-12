'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { PropsWithChildren } from 'react';

import { env } from './env.client';
import { PostHogIdentifyUser } from './posthog/client';
import { WebVitals } from './web-vitals';

// Build-time prod check
const isBuildProduction = env.NODE_ENV === 'production';
// Runtime environment hint from Vercel
const vercelEnv = env.NEXT_PUBLIC_VERCEL_ENV;
const isVercelProduction = vercelEnv === 'production';
// Final: enable analytics in real production builds only
const isProduction = isBuildProduction && isVercelProduction;

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
