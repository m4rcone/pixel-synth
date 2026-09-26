import { ALGORITHMS } from "@/lib/algorithms";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";

export const alt = "The PixelSynth editor";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Editor",
    title: "Develop any image",
    subtitle: `Upload a photo, pick one of ${ALGORITHMS.length} dithering algorithms, tune it and export a PNG. Nothing leaves your device.`,
    image: "/250/pixel-synth-12.png",
  });
}
