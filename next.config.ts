import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: { serverFunctions: false },
  images: {
    qualities: [75, 80, 85],
  },
};

export default nextConfig;
