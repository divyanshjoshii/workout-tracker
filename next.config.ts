import type { NextConfig } from "next";

// The service worker is hand-written in public/sw.js. The @ducanh2912/next-pwa
// wrapper that used to be here is a webpack plugin, and this project builds with
// Turbopack, so it never produced one; under a webpack build it would also have
// overwritten public/sw.js.
const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        // Per Next's PWA guide: the browser must re-check the service worker on
        // every visit, or an old one keeps running after a deploy.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
