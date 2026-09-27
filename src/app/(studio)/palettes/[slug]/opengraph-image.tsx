import { getAlgorithm } from "@/lib/algorithms";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";
import {
  getPaletteGuide,
  guidePresets,
  PALETTE_GUIDES,
} from "@/lib/palette-guides";
import {
  PALETTE_PREVIEW_ALGORITHM,
  PALETTE_PREVIEW_SIZE,
  palettePreview,
} from "@/lib/samples";

export const alt = "A synthwave sunset dithered with this color palette";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return PALETTE_GUIDES.map(({ slug }) => ({ slug }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const guide = getPaletteGuide((await params).slug)!;
  const [{ preset }] = guidePresets(guide);
  return renderOgImage({
    eyebrow: "Color palette",
    title: `${guide.name} palette`,
    subtitle: `${preset.colors.length} colors with every hex code, and a free tool to dither any image to them.`,
    image: palettePreview(preset.id),
    imageSize: PALETTE_PREVIEW_SIZE,
    caption: `${getAlgorithm(PALETTE_PREVIEW_ALGORITHM)?.shortName} · ${preset.name}`,
  });
}
