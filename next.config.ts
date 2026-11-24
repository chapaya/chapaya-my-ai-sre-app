import type { NextConfig } from "next";

// `npm run build:android` sets STATIC_EXPORT=1 to write a plain HTML/CSS/JS
// copy of the site to out/, which Capacitor bundles into the Android app.
// Static export can't use Cache Components / Partial Prefetching (they need a
// server), so they're only on for normal builds. Vercel is unaffected.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport
    ? { output: "export" as const }
    : { cacheComponents: true, partialPrefetching: true }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
