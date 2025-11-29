import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['puppeteer'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'puppeteer'];
    return config;
  },
};

export default nextConfig;
