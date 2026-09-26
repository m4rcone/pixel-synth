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
  images: {
    // 95 keeps smooth gradients (the source sphere) free of WebP blocking.
    qualities: [75, 95],
  },
};

export default nextConfig;
