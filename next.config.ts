import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'puppeteer'];
    return config;
  },
};

export default nextConfig;
