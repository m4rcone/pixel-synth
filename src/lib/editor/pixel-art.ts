import { MIN_SCALE, type EditorSettings } from "./settings";

/**
 * The pixel art preset: PICO-8 with a 2×2 Bayer pattern, processed at a
 * fixed amount of pixels (≈128×96) whatever the image's shape, so portraits,
 * squares and panoramas all get the same level of pixelation.
 */
export const PIXEL_ART_PRESET = {
  /** Target pixel count of the processed image (128 × 96). */
  targetPixels: 128 * 96,
  /** Keeps extreme panoramas from collapsing into a thin strip. */
  minShortSide: 48,
  algorithm: "bayer-2-2",
  palette: "pico8",
  match: "color",
} as const;

/** Processing scale that brings a `width`×`height` image to the preset's size. */
export function pixelArtScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1;
  const byArea = Math.sqrt(PIXEL_ART_PRESET.targetPixels / (width * height));
  const byShortSide = PIXEL_ART_PRESET.minShortSide / Math.min(width, height);
  return Math.min(1, Math.max(MIN_SCALE, byArea, byShortSide));
}

/** Settings patch for the preset, sized for the given source image. */
export function pixelArtSettings(
  settings: EditorSettings,
  source: { width: number; height: number } | null,
): Partial<EditorSettings> {
  return {
    algorithm: PIXEL_ART_PRESET.algorithm,
    scale: source ? pixelArtScale(source.width, source.height) : settings.scale,
    color: {
      ...settings.color,
      mode: "palette",
      palette: PIXEL_ART_PRESET.palette,
      match: PIXEL_ART_PRESET.match,
    },
  };
}
