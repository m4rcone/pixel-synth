import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — dithering and pixel art`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/editor",
    display: "standalone",
    background_color: "#05080d",
    theme_color: "#05080d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
