import type { MetadataRoute } from "next";
import { ALGORITHMS } from "@/lib/algorithms";
import { absoluteUrl, siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(siteConfig.updated);

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      images: [absoluteUrl(siteConfig.previewImage)],
    },
    {
      url: absoluteUrl("/editor"),
      lastModified,
    },
    {
      url: absoluteUrl("/algorithms"),
      lastModified,
      images: ALGORITHMS.map((algorithm) => absoluteUrl(algorithm.preview)),
    },
    ...ALGORITHMS.map((algorithm) => ({
      url: absoluteUrl(`/algorithms/${algorithm.slug}`),
      lastModified,
      images: [absoluteUrl(algorithm.preview)],
    })),
  ];
}
