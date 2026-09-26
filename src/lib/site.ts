import type { Metadata } from "next";
import { ALGORITHMS } from "@/lib/algorithms";

export const siteConfig = {
  name: "PixelSynth",
  /** Home title, used as is (the root layout applies no template to it). */
  title: "Free Online Dithering & Pixel Art Tool | PixelSynth",
  url: "https://pixelsynth.art",
  description: `Turn photos into dithered, 1-bit or pixel art images in your browser. ${ALGORITHMS.length} algorithms, Game Boy, PICO-8 and CGA palettes. Free, no uploads.`,
  creator: "m4rcone",
  previewImage: "/250/pixel-synth.png",
  /** Last meaningful content update, used by the sitemap. */
  updated: "2026-09-25",
  links: {
    /** Author profile (structured data). */
    github: "https://github.com/m4rcone",
    /** Source code (site navigation). */
    repository: "https://github.com/m4rcone/pixel-synth",
  },
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

/**
 * Per-page metadata with a canonical URL and matching Open Graph / Twitter
 * fields. Social images come from the route's `opengraph-image` file.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const fullTitle = `${title} | ${siteConfig.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export function breadcrumbStructuredData(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map(
      (item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
      }),
    ),
  };
}
