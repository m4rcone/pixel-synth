import { getAlgorithm } from "@/lib/algorithms";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";
import { getPalettePreset, PALETTE_PRESETS } from "@/lib/palettes";
import {
  PALETTE_PREVIEW_ALGORITHM,
  PALETTE_PREVIEW_SIZE,
  palettePreview,
} from "@/lib/samples";

export const alt =
  "PixelSynth — a synthwave sunset dithered with the PixelSynth palette";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Online dithering & pixel art",
    title: ["Smooth in.", "Dither out."],
    subtitle: `Photos and GIFs to 1-bit, halftone or pixel art. ${PALETTE_PRESETS.length} palettes. Nothing uploaded.`,
    image: palettePreview("pixelsynth"),
    imageSize: PALETTE_PREVIEW_SIZE,
    caption: `${getAlgorithm(PALETTE_PREVIEW_ALGORITHM)?.shortName} · ${getPalettePreset("pixelsynth")?.name}`,
  });
}
