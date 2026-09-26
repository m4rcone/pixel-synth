/**
 * Generated sample assets (see scripts/generate-previews.mjs). The sample is
 * a procedural sunset scene with a calibration strip (grayscale ramp + hue
 * spectrum), used by the editor's "Try a sample image" and the palette pages.
 */

import { ALGORITHMS, type AlgorithmId } from "@/lib/algorithms";
import { pixelArtScale } from "@/lib/editor/pixel-art";
import { PALETTE_PRESETS } from "@/lib/palettes";

export const SAMPLE_IMAGE = {
  src: "/samples/sunset.png",
  name: "sunset.png",
  width: 1800,
  height: 1200,
} as const;

/**
 * Animated sample: the same scene without the strip, the sun rising and
 * setting over one seamless loop. 256 colors, not dithered.
 */
export const ANIMATED_SAMPLE = {
  src: "/samples/sunset.gif",
  name: "sunset.gif",
  width: 360,
  height: 240,
  frames: 24,
  /** Milliseconds per frame. */
  delay: 80,
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

/**
 * Landing hero: the sample at 240×160, one image per algorithm × palette
 * pair, every algorithm and every preset palette plus 1-bit (the editor's
 * default black-and-white mode, not a palette), in catalog order. The first
 * of each list is what the hero opens on. Also the undithered original at
 * twice that size for the "before" side.
 */
export const HERO_ALGORITHMS: readonly AlgorithmId[] = ALGORITHMS.map(
  (algorithm) => algorithm.slug,
);
export const HERO_PALETTES: readonly string[] = [
  "1-bit",
  ...PALETTE_PRESETS.map((palette) => palette.id),
];
export const HERO_SIZE = { width: 240, height: 160 } as const;

/** Image path pattern of a hero variant, for code that can't call `heroVariant`. */
export const HERO_VARIANT_PATTERN = "/landing/sunset-{algorithm}-{palette}.png";

export function heroVariant(algorithm: string, palette: string) {
  return HERO_VARIANT_PATTERN.replace("{algorithm}", algorithm).replace(
    "{palette}",
    palette,
  );
}

export const HERO_ORIGINAL = {
  src: "/landing/sunset-original.png",
  width: 480,
  height: 320,
} as const;

/** The animated sample dithered, and its first frame for when it's paused. */
export const ANIMATED_DITHER = {
  src: "/landing/sunset-animated-bayer-4-4-pico8.gif",
  still: "/landing/sunset-animated-bayer-4-4-pico8.png",
  algorithm: "bayer-4-4",
  palette: "pico8",
  width: ANIMATED_SAMPLE.width / 2,
  height: ANIMATED_SAMPLE.height / 2,
} as const;
