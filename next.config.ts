import type { NextConfig } from "next";

// Work around a Vercel adapter crash in Next 16.2.6 where Preview Comments
// injection receives an undefined projectDir during `modifyConfig`.
if (process.env.VERCEL_PREVIEW_COMMENTS_ENABLED === "1") {
  process.env.VERCEL_PREVIEW_COMMENTS_ENABLED = "0";
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
