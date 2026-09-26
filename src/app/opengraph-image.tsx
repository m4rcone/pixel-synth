import { OG_SIZE, renderOgImage } from "@/lib/og-image";
import { PALETTE_PRESETS } from "@/lib/palettes";
import { palettePreview, PALETTE_PREVIEW_SIZE } from "@/lib/samples";

export const alt =
  "PixelSynth — a ringed planet dithered with the Game Boy palette";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "In-browser dithering lab",
    title: "Smooth in. Dither out.",
    subtitle: `Dither images · Pixel art · ${PALETTE_PRESETS.length} palettes`,
    image: palettePreview("gameboy"),
    imageSize: PALETTE_PREVIEW_SIZE,
  });
}
