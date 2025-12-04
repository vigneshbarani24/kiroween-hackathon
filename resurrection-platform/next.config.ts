import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Vercel
  output: 'standalone',
  // Generate unique build IDs for each deployment
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
};

export default nextConfig;
