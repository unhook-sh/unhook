import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    scrollRestoration: true,
    // dynamicIO: true,
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

export default configWithPlugins;
