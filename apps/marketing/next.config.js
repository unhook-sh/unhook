import { fileURLToPath } from "url";
import createJiti from "jiti";

import baseConfig from "@acme/next-config/base";

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
createJiti(fileURLToPath(import.meta.url))("./src/env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...baseConfig,
  transpilePackages: [
    ...(baseConfig.transpilePackages ?? []),
    "@acme/api",
    "@acme/db",
    "@acme/ui",
    "@acme/validators",
  ],
};

export default nextConfig;
