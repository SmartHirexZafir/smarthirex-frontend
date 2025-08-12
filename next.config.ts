// next.config.ts
import type { NextConfig } from "next";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:10000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/default-avatar.png",
        destination: `${API_BASE}/default-avatar.png`,
      },
    ];
  },
};

export default nextConfig;
