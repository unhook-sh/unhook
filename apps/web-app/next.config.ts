
import baseConfig from '@unhook/next-config/base';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...baseConfig,
  transpilePackages: [
    '@unhook/analytics',
    '@unhook/api',
    '@unhook/db',
    '@unhook/id',
    '@unhook/ui',
    '@unhook/client',
    '@unhook/logger',
  ],
};

export default nextConfig;
