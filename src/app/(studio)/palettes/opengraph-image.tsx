import { PALETTE_PRESETS } from "@/lib/palettes";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";
import { palettePreview, PALETTE_PREVIEW_SIZE } from "@/lib/samples";

export const alt = "A sunset scene dithered with the PICO-8 palette";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Palettes",
    title: "Color palettes",
    subtitle: `Dither to ${PALETTE_PRESETS.length} classic palettes — Game Boy, PICO-8, CGA, EGA, sepia, cyanotype — or your own colors.`,
    image: palettePreview("pico8"),
    imageSize: PALETTE_PREVIEW_SIZE,
  });
}
