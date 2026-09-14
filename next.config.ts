import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  agentRules: false,
  // Production build/local `next dev` use Turbopack (default); the webpack
  // config below only kicks in for `next dev --webpack` inside Docker, where
  // bind-mounted source needs polling since inotify doesn't propagate there.
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      // Docker bind mounts don't propagate inotify events reliably —
      // force polling so file edits on the host trigger a rebuild.
      config.watchOptions = { poll: 800, aggregateTimeout: 300 };
    }
    return config;
  },
};

export default nextConfig;
