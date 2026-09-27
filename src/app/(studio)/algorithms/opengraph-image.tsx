import { ALGORITHMS, getAlgorithm } from "@/lib/algorithms";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";

const SHOWN = getAlgorithm("bayer-4-4")!;

export const alt = "The PixelSynth dithering algorithm catalog";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Catalog",
    title: "Dithering algorithms",
    subtitle: `${ALGORITHMS.length} techniques, compared on one image: error diffusion, ordered, noise and halftone screens.`,
    image: SHOWN.preview,
    caption: `${SHOWN.shortName} · 1-bit`,
  });
}
