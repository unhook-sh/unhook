import withBundleAnalyzer from '@next/bundle-analyzer';
import { withPostHogConfig } from '@posthog/nextjs-config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // dynamicIO: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Forward browser logs to the terminal for easier debugging
    browserDebugInfoInTerminal: true,

    // cacheLife: true,
    cacheComponents: true,
    // Activate new client-side router improvements
    clientSegmentCache: true, // will be renamed to cacheComponents in Next.js 16

    // Explore route composition and segment overrides via DevTools
    devtoolSegmentExplorer: true,
    // Enable new caching and pre-rendering behavior

    enablePrerenderSourceMaps: true,
    // Enable support for `global-not-found`, which allows you to more easily define a global 404 page.
    globalNotFound: true,
    scrollRestoration: true,
    turbopackPersistentCaching: true,
    useCache: true,
  },
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'gravatar.com' },
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'cloudflare-ipfs.com' },
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'media.licdn.com' },
      { hostname: 'img.clerk.com' },
      { hostname: 'image.tmdb.org' },
      { hostname: 'picsum.photos' },
      { hostname: 'unhook.sh' },
      { hostname: 'randomuser.me' },
      { hostname: 'cdn.brandfetch.io' },
    ],
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  poweredByHeader: false,
  // compiler: {
  // removeConsole: true,
  // },
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
};

const withPlugins = [
  process.env.WITH_BUNDLE_ANALYZER === 'true'
    ? withBundleAnalyzer({ enabled: true })
    : null,
].filter((plugin) => plugin !== null);

const configWithPlugins = withPlugins.reduce(
  (acc, plugin) => plugin(acc),
  nextConfig,
);

/** @type {import('next').NextConfig} */
const finalConfig = withPostHogConfig(configWithPlugins, {
  envId: process.env.POSTHOG_ENV_ID, // Environment ID
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST, // (optional), defaults to https://us.posthog.com
  personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY, // Personal API Key
});

export default finalConfig;
