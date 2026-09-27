import { ALGORITHMS, getAlgorithm } from "@/lib/algorithms";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";

const SHOWN = getAlgorithm("blue-noise")!;

export const alt = `The PixelSynth editor: a CRT terminal dithered with ${SHOWN.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Editor",
    title: "Dither any image",
    subtitle: `Open a photo or GIF, pick one of ${ALGORITHMS.length} algorithms, export PNG or GIF. Nothing leaves your device.`,
    image: SHOWN.preview,
    caption: `${SHOWN.shortName} · 1-bit`,
  });
}
