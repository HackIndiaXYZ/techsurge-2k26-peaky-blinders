import type { NextConfig } from "next";

/**
 * The three-app redesign moved the demo routes into an app-per-namespace
 * layout (/app/inbox, /app/flow, /app/pausepay). Everything that pointed at
 * the old paths — bookmarks, QR codes on slides, the earlier /demo aliases —
 * is redirected rather than broken, since a 404 mid-demo is unrecoverable.
 */
const legacyPaths: Array<[string, string]> = [
  ["/demo", "/app/inbox"],
  ["/demo/messages", "/app/inbox"],
  ["/demo/payment", "/app/flow/pay"],
  ["/demo/decision", "/app/flow/pay"],
  ["/review/:path*", "/app/flow/pay"],
  // Pre-redesign route names.
  ["/app/messages", "/app/inbox"],
  ["/app/messages/:id", "/app/inbox/:id"],
  ["/app/pay", "/app/flow/pay"],
  ["/app/pay/home", "/app/flow"],
  ["/app/check", "/app/pausepay/check"],
  ["/app/activity", "/app/pausepay/activity"],
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return legacyPaths.map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
