import { ALGORITHMS } from "@/lib/algorithms";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";

export const alt = "The PixelSynth editor";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Editor",
    title: "Dither any image",
    subtitle: `Open a photo or GIF, pick one of ${ALGORITHMS.length} dithering algorithms, tune it and export a PNG or GIF. Nothing leaves your device.`,
    image: "/specimens/blue-noise.png",
  });
}
