import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Add Puppeteer support for server-side rendering
  serverExternalPackages: ['puppeteer'],

  // Ignore ESLint errors during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'puppeteer'];
    }
    return config;
  },
};

export default nextConfig;
// Deployment trigger Sat Nov 29 13:05:09 MST 2025
// Deploy 1764447382
