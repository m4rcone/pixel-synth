import { ALGORITHMS } from "@/lib/algorithms";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";

export const alt = "The PixelSynth dithering algorithm catalog";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Catalog",
    title: "Dithering algorithms",
    subtitle: `${ALGORITHMS.length} techniques — error diffusion, ordered and noise-based — shown on the same sphere.`,
    image: "/250/pixel-synth-9.png",
  });
}
