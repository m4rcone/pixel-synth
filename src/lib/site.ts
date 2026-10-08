import type { Metadata } from "next";
import { ALGORITHMS } from "@/lib/algorithms";

export const siteConfig = {
  name: "PixelSynth",
  /** Home title, used as is (the root layout applies no template to it). */
  title: "Free Online Dithering & Pixel Art Tool | PixelSynth",
  url: "https://pixelsynth.art",
  description: `Turn photos and animated GIFs into dithered, 1-bit or pixel art in your browser. ${ALGORITHMS.length} algorithms, Game Boy, NES, PICO-8 and CGA palettes. Free, no uploads.`,
  creator: "m4rcone",
  previewImage: "/specimens/floyd-steinberg.png",
  /**
   * Last meaningful content update (YYYY-MM-DD) of the pages without their
   * own date in `pageUpdates` or in their guide; used by the sitemap and the
   * guides' structured data.
   */
  updated: "2026-09-26",
  /** Pages updated since `updated`, by path. */
  pageUpdates: {
    "/": "2026-10-08",
    "/editor": "2026-10-08",
    "/palettes": "2026-10-08",
  } as Record<string, string>,
  links: {
    /** Author profile (structured data). */
    github: "https://github.com/m4rcone",
    /** Source code (site navigation). */
    repository: "https://github.com/m4rcone/pixel-synth",
    /** Donations (footer, studio sidebar, save dialog, FAQ). */
    support: "https://ko-fi.com/m4rcone",
  },
};

/** Last meaningful content update of a page: its own date or the site's. */
export function pageUpdated(path: string, own?: string) {
  return own ?? siteConfig.pageUpdates[path] ?? siteConfig.updated;
}

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
