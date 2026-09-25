import type { Metadata } from "next";

export const siteConfig = {
  name: "PixelSynth",
  title: "PixelSynth - Dithering Image Editor",
  url: "https://pixelsynth.art",
  description:
    "Transform images into algorithmic art using real dithering techniques. Experiment, compare, and synth your pixels.",
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
