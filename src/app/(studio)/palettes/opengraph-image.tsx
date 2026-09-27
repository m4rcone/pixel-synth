import { getAlgorithm } from "@/lib/algorithms";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";
import { getPalettePreset, PALETTE_PRESETS } from "@/lib/palettes";
import {
  PALETTE_PREVIEW_ALGORITHM,
  PALETTE_PREVIEW_SIZE,
  palettePreview,
} from "@/lib/samples";

export const alt = "A synthwave sunset dithered with the PICO-8 palette";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Palettes",
    title: "Retro color palettes",
    subtitle: `${PALETTE_PRESETS.length} palettes with every hex value: Game Boy, NES, PICO-8, CGA, C64 or your own.`,
    image: palettePreview("pico8"),
    imageSize: PALETTE_PREVIEW_SIZE,
    caption: `${getAlgorithm(PALETTE_PREVIEW_ALGORITHM)?.shortName} · ${getPalettePreset("pico8")?.name}`,
  });
}
