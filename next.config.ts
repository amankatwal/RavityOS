import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/10.x/**",
        
      },
        {
        protocol: "https",
        hostname: "logos.composio.dev",
        pathname: "/api/**",
      },
    ],
  },
};

export default nextConfig;
