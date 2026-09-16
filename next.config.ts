import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "xlsx"],
  agentRules: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
