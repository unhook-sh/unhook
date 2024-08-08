"use client";

import type { PropsWithChildren } from "react";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";

import { env } from "../env";

if (typeof window !== "undefined") {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    loaded: (posthog) => {
      if (env.NODE_ENV === "development") posthog.debug(false);
    },
    person_profiles: "identified_only",
  });
}
export function PostHogProvider({ children }: PropsWithChildren) {
  return <Provider client={posthog}>{children}</Provider>;
}
