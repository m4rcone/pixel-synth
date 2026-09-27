import type { MetadataRoute } from "next";
import { BRAND_COLORS } from "@/lib/brand";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — dithering and pixel art`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/editor",
    display: "standalone",
    background_color: BRAND_COLORS.ink,
    theme_color: BRAND_COLORS.ink,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
