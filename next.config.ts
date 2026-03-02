import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@aws-sdk/client-s3",
      "@aws-sdk/s3-request-presigner",
      "@anthropic-ai/sdk",
    ],
  },
  webpack: (config: ReturnType<NonNullable<NextConfig["webpack"]>>, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      config.optimization = config.optimization || {};
      config.optimization.minimize = true;
    }
    return config;
  },
};

export default nextConfig;
