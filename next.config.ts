import type { NextConfig } from "next";

// Work around a Vercel adapter crash in Next 16.2.6 where Preview Comments
// injection receives an undefined projectDir during `modifyConfig`.
if (process.env.VERCEL_PREVIEW_COMMENTS_ENABLED === "1") {
  process.env.VERCEL_PREVIEW_COMMENTS_ENABLED = "0";
}

const nextConfig: NextConfig = {
  // Playwright reaches a running `npm run dev` at 127.0.0.1; without this,
  // Next blocks its dev resources there and the page never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // React <ViewTransition> on navigation (src/components/page-transition.tsx).
    viewTransition: true,
  },
  images: {
    // 95 keeps smooth gradients (the undithered "before" images) free of WebP
    // blocking.
    qualities: [75, 95],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
      {
        // Generated previews keep their names when regenerated, so they are
        // cached for a day and revalidated in the background, not immutable.
        source:
          "/:dir(landing|palettes|samples|specimens|icons)/:file([^/]+\\.(?:png|gif))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
