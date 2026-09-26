import { ALGORITHMS } from "@/lib/algorithms";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";

export const alt = "The PixelSynth dithering algorithm catalog";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Catalog",
    title: "Dithering algorithms",
    subtitle: `${ALGORITHMS.length} techniques — error diffusion, ordered, noise-based and halftone screens — shown on the same specimen.`,
    image: "/specimens/bayer-4-4.png",
  });
}
