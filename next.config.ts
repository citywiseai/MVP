import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Add Puppeteer support for server-side rendering
  serverExternalPackages: ['puppeteer'],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'puppeteer'];
    }
    return config;
  },
};

export default nextConfig;
