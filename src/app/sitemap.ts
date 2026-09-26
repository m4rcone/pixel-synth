import type { MetadataRoute } from "next";
import { ALGORITHMS } from "@/lib/algorithms";
import { PALETTE_PRESETS } from "@/lib/palettes";
import {
  ANIMATED_DITHER,
  HERO_ORIGINAL,
  heroVariant,
  palettePreview,
  PIXEL_ART_PREVIEW,
} from "@/lib/samples";
import { absoluteUrl, siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(siteConfig.updated);

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      images: [
        absoluteUrl(heroVariant("floyd-steinberg", "1-bit")),
        absoluteUrl(HERO_ORIGINAL.src),
        absoluteUrl(ANIMATED_DITHER.src),
        absoluteUrl(siteConfig.previewImage),
      ],
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
    {
      url: absoluteUrl("/palettes"),
      lastModified,
      images: [
        absoluteUrl(PIXEL_ART_PREVIEW.src),
        ...PALETTE_PRESETS.map((palette) =>
          absoluteUrl(palettePreview(palette.id)),
        ),
      ],
    },
    ...ALGORITHMS.map((algorithm) => ({
      url: absoluteUrl(`/algorithms/${algorithm.slug}`),
      lastModified,
      images: [absoluteUrl(algorithm.preview)],
    })),
  ];
}
