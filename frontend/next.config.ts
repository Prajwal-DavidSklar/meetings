import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "192.168.0.230",
        port: "8000",
        pathname: "/api/v1/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/api/v1/uploads/**",
      },
      {
        protocol: "https",
        hostname: "meeting.davidsklar.com",
        pathname: "/api/v1/uploads/**",
      },
    ],
  },
};

export default nextConfig;
