"use client";

import type { PropsWithChildren } from "react";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "nextjs-google-analytics";

import { env } from "./env.client";
import { WebVitals } from "./nextjs/web-vitals";
import {
  PostHogIdentifyUser,
  PostHogProvider,
  PosthogWebVitals,
} from "./posthog/client";

const isProduction = env.NEXT_PUBLIC_APP_ENV === "production";

const PostHogPageView = dynamic(
  () => import("./posthog/client").then((module_) => module_.PostHogPageView),
  {
    ssr: false,
  },
);

export function AnalyticsProviders(
  props: PropsWithChildren & { identifyUser?: boolean },
) {
  return (
    <>
      {isProduction && (
        <PostHogProvider>
          <GoogleAnalytics trackPageViews />
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
