import { dither } from "./dither";
import { applyFilters } from "./filters";
import { clonePixels, createPixels, luminance, type Pixels } from "./pixels";
import { resizeArea, resizeNearest } from "./resize";
import { hasActiveFilters, type EditorSettings } from "./settings";
import { toneMap } from "./tone-mapping";

/**
 * The full image pipeline, as a pure function:
 *
 *   source → (downscale) → filters → luminance → dither → tone map → (upscale)
 *
 * Without `dither`, only the filters are applied (live preview before the
 * user commits to dithering).
 */
export function renderPixels(
  source: Pixels,
  settings: EditorSettings,
  { dither: shouldDither }: { dither: boolean },
): Pixels {
  const scaled = shouldDither && settings.scale < 1;

  let pixels = scaled
    ? resizeArea(
        source,
        Math.max(1, Math.round(source.width * settings.scale)),
        Math.max(1, Math.round(source.height * settings.scale)),
      )
    : clonePixels(source);

  if (hasActiveFilters(settings.filters)) {
    applyFilters(pixels, settings.filters);
  }

  if (!shouldDither) return pixels;

  const gray = luminance(pixels);
  const bits = dither(gray, pixels.width, pixels.height, settings.algorithm);
  const out = createPixels(pixels.width, pixels.height);
  toneMap(bits, gray, pixels.data, out.data, settings);
  pixels = out;

  return scaled ? resizeNearest(pixels, source.width, source.height) : pixels;
}
