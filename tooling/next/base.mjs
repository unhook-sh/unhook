// @ts-check
import withBundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // compiler: {
  // removeConsole: true,
  // },
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    scrollRestoration: true,
    typedRoutes: true,
    // dynamicIO: true,
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  serverExternalPackages: ["@boundaryml/baml"],
  images: {
    remotePatterns: [
      { hostname: "images.unsplash.com" },
      { hostname: "gravatar.com" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "cloudflare-ipfs.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "media.licdn.com" },
      { hostname: "img.clerk.com" },
      { hostname: "image.tmdb.org" },
      { hostname: "picsum.photos" },
    ],
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: true },
  webpack: (config, { dev, isServer, webpack, nextRuntime }) => {
    config.module.rules.push({
      test: /\.node$/,
      use: [
        {
          loader: "nextjs-node-loader",
          options: {
            outputPath: config.output.path,
          },
        },
      ],
    });
    return config;
  },
};

export default withBundleAnalyzer({
  enabled: process.env.NEXT_ANALYZE === "true",
})(nextConfig);
