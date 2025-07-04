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
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Optimize for production
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
