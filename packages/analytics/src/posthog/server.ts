import { PostHog } from "posthog-node";

import { env } from "../env";

export const client = new PostHog(env.POSTHOG_KEY, {
  host: "https://us.i.posthog.com",
});
