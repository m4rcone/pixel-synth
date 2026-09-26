/**
 * Generated sample assets (see scripts/generate-previews.mjs). The sample is
 * a procedural sunset scene with a calibration strip (grayscale ramp + hue
 * spectrum), used by the editor's "Try a sample image" and the palette pages.
 */

import { pixelArtScale } from "@/lib/editor/pixel-art";

export const SAMPLE_IMAGE = {
  src: "/samples/sunset.png",
  name: "sunset.png",
  width: 1800,
  height: 1200,
} as const;

/** Palette previews: the sample rendered at 480×320. */
export const PALETTE_PREVIEW_SIZE = { width: 480, height: 320 } as const;

export function palettePreview(id: string) {
  return `/palettes/${id}.png`;
}

const pixelArtSampleScale = pixelArtScale(
  SAMPLE_IMAGE.width,
  SAMPLE_IMAGE.height,
);

/** Pixel art preset applied to the sample (native size, shown enlarged). */
export const PIXEL_ART_PREVIEW = {
  src: "/palettes/pixel-art.png",
  scale: pixelArtSampleScale,
  width: Math.max(1, Math.round(SAMPLE_IMAGE.width * pixelArtSampleScale)),
  height: Math.max(1, Math.round(SAMPLE_IMAGE.height * pixelArtSampleScale)),
} as const;

/** Preview settings shared by the generator and the page copy. */
export const PALETTE_PREVIEW_ALGORITHM = "floyd-steinberg" as const;
export const EXTRACTED_PREVIEW_COLORS = 8;
