import { getPalettePreset } from "@/lib/palettes";
import { dither } from "./dither";
import { applyFilters } from "./filters";
import { ditherToPalette, extractPalette } from "./palette-dither";
import { clonePixels, createPixels, luminance, type Pixels } from "./pixels";
import { resizeArea } from "./resize";
import { hasActiveFilters, type EditorSettings } from "./settings";
import { toneMap } from "./tone-mapping";

export type RenderResult = {
  /**
   * The rendered image at its native (processing) resolution. With a scale
   * below 1 it is smaller than the source; display and export enlarge it
   * nearest-neighbor.
   */
  pixels: Pixels;
  /** Colors actually used in palette mode (resolved for "extracted"). */
  palette: string[] | null;
};

/**
 * The full image pipeline, as a pure function:
 *
 *   source → (downscale) → filters → dither (mono + tone map | palette)
 *
 * Without `dither`, only the filters are applied (live preview before the
 * user commits to dithering).
 */
export function renderPixels(
  source: Pixels,
  settings: EditorSettings,
  { dither: shouldDither }: { dither: boolean },
): RenderResult {
  let pixels =
    shouldDither && settings.scale < 1
      ? resizeArea(
          source,
          Math.max(1, Math.round(source.width * settings.scale)),
          Math.max(1, Math.round(source.height * settings.scale)),
        )
      : clonePixels(source);

  if (hasActiveFilters(settings.filters)) {
    applyFilters(pixels, settings.filters);
  }

  if (!shouldDither) return { pixels, palette: null };

  if (settings.color.mode === "palette") {
    const palette = resolvePalette(pixels, settings);
    return {
      pixels: ditherToPalette(
        pixels,
        settings.algorithm,
        palette,
        settings.color.match,
      ),
      palette,
    };
  }

  const gray = luminance(pixels);
  const bits = dither(gray, pixels.width, pixels.height, settings.algorithm);
  const out = createPixels(pixels.width, pixels.height);
  toneMap(bits, gray, pixels.data, out.data, settings);
  pixels = out;
  return { pixels, palette: null };
}

function resolvePalette(pixels: Pixels, { color }: EditorSettings): string[] {
  if (color.palette === "extracted") {
    return extractPalette(pixels, color.extractCount);
  }
  if (color.palette === "custom") return color.custom;
  return [...getPalettePreset(color.palette)!.colors];
}
