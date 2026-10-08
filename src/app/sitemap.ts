import type { MetadataRoute } from "next";
import { ALGORITHMS } from "@/lib/algorithms";
import { guidePresets, PALETTE_GUIDES } from "@/lib/palette-guides";
import { PALETTE_PRESETS } from "@/lib/palettes";
import {
  ANIMATED_DITHER,
  HERO_ORIGINAL,
  heroVariant,
  palettePreview,
  PIXEL_ART_PREVIEW,
} from "@/lib/samples";
import { ALGORITHM_GUIDES } from "@/lib/algorithm-guides";
import { absoluteUrl, pageUpdated, siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = (path: string, own?: string) =>
    new Date(pageUpdated(path, own));

  return [
    {
      url: absoluteUrl("/"),
      lastModified: lastModified("/"),
      images: [
        absoluteUrl(heroVariant("floyd-steinberg", "1-bit")),
        absoluteUrl(HERO_ORIGINAL.src),
        absoluteUrl(ANIMATED_DITHER.src),
        absoluteUrl(siteConfig.previewImage),
      ],
    },
    {
      url: absoluteUrl("/editor"),
      lastModified: lastModified("/editor"),
    },
    {
      url: absoluteUrl("/algorithms"),
      lastModified: lastModified("/algorithms"),
      images: ALGORITHMS.map((algorithm) => absoluteUrl(algorithm.preview)),
    },
    {
      url: absoluteUrl("/palettes"),
      lastModified: lastModified("/palettes"),
      images: [
        absoluteUrl(PIXEL_ART_PREVIEW.src),
        ...PALETTE_PRESETS.map((palette) =>
          absoluteUrl(palettePreview(palette.id)),
        ),
      ],
    },
    ...ALGORITHMS.map((algorithm) => ({
      url: absoluteUrl(`/algorithms/${algorithm.slug}`),
      lastModified: lastModified(
        `/algorithms/${algorithm.slug}`,
        ALGORITHM_GUIDES[algorithm.slug].updated,
      ),
      images: [absoluteUrl(algorithm.preview)],
    })),
    ...PALETTE_GUIDES.map((guide) => ({
      url: absoluteUrl(`/palettes/${guide.slug}`),
      lastModified: lastModified(`/palettes/${guide.slug}`, guide.updated),
      images: guidePresets(guide).map(({ id }) =>
        absoluteUrl(palettePreview(id)),
      ),
    })),
  ];
}
