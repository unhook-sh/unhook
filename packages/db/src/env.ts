import { createEnv } from "@t3-oss/env-core";
// import { } from "@t3-oss/env-core/presets";
import { z } from "zod";

export const env = createEnv({
  client: {},
  clientPrefix: "",
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    POSTGRES_URL: z.string(),
  },
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
