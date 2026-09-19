import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      {
        source: "/demo",
        destination: "/app/messages",
        permanent: false,
      },
      {
        source: "/demo/messages",
        destination: "/app/messages",
        permanent: false,
      },
      {
        source: "/demo/payment",
        destination: "/app/pay",
        permanent: false,
      },
      {
        source: "/demo/decision",
        destination: "/app/pay",
        permanent: false,
      },
      {
        source: "/review/:path*",
        destination: "/app/pay",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
