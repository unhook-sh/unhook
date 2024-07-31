import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

import baseConfig from "@acme/tailwind-config/web";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  content: [...baseConfig.content, "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [baseConfig],
  plugins: [...baseConfig.plugins, animate],
} satisfies Config;
