import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cho phép tất cả HTTPS domains
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      // Cho phép tất cả HTTP domains (local development)
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
