import { getPalettePreset } from "@/lib/palettes";
import { ditherCmyk } from "./cmyk";
import { dither } from "./dither";
import { applyFilters } from "./filters";
import { ditherToPalette, extractPalette } from "./palette-dither";
import {
  clonePixels,
  createPixels,
  luminance,
  transparentMask,
  type Pixels,
} from "./pixels";
import { resizeArea } from "./resize";
import { dotsAreInk, hasActiveFilters, type EditorSettings } from "./settings";
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

export type RenderOptions = {
  dither: boolean;
  /**
   * Palette to use in palette mode instead of resolving it from `source`,
   * so every frame of an animation shares the same colors.
   */
  palette?: string[];
};

/**
 * The full image pipeline, as a pure function:
 *
 *   source → (downscale) → filters → dither (mono + tone map | palette | CMYK)
 *
 * Without `dither`, only the filters are applied.
 */
export function renderPixels(
  source: Pixels,
  settings: EditorSettings,
  { dither: shouldDither, palette: fixedPalette }: RenderOptions,
): RenderResult {
  let pixels = prepare(source, settings, shouldDither);

  if (!shouldDither) return { pixels, palette: null };

  if (settings.color.mode === "cmyk") {
    return { pixels: ditherCmyk(pixels, settings), palette: null };
  }

  if (settings.color.mode === "palette") {
    const palette = fixedPalette ?? resolvePalette(pixels, settings);
    return {
      pixels: ditherToPalette(
        pixels,
        settings.algorithm,
        palette,
        settings.color.match,
        settings.diffusion,
        settings.screen,
      ),
      palette,
    };
  }

  const gray = luminance(pixels);
  const bits = dither(
    gray,
    pixels.width,
    pixels.height,
    settings.algorithm,
    settings.diffusion,
    // Screen dots take the shape of whatever the tone map draws as dots.
    { ...settings.screen, light: !dotsAreInk(settings) },
    0,
    transparentMask(pixels),
  );
  const out = createPixels(pixels.width, pixels.height);
  toneMap(bits, gray, pixels.data, out.data, pixels.width, settings);
  pixels = out;
  return { pixels, palette: null };
}

/** Downscale (when dithering) and filters: what the dither step sees. */
function prepare(source: Pixels, settings: EditorSettings, dither: boolean) {
  const pixels =
    dither && settings.scale < 1
      ? resizeArea(
          source,
          Math.max(1, Math.round(source.width * settings.scale)),
          Math.max(1, Math.round(source.height * settings.scale)),
        )
      : clonePixels(source);
  if (hasActiveFilters(settings.filters)) {
    applyFilters(pixels, settings.filters);
  }
  return pixels;
}

/** Frames "From image" extracts an animation's palette from, at most. */
const PALETTE_SAMPLE_FRAMES = 16;

/**
 * The one palette every frame of an animation is dithered to, or undefined
 * outside palette mode. "From image" extracts it from a montage of up to
 * {@link PALETTE_SAMPLE_FRAMES} evenly spaced frames, so colors that only
 * appear later in the animation still get a slot.
 */
export function resolveAnimationPalette(
  frames: Pixels[],
  settings: EditorSettings,
): string[] | undefined {
  if (settings.color.mode !== "palette") return undefined;
  // Presets and custom palettes don't depend on the pixels.
  if (settings.color.palette !== "extracted") {
    return resolvePalette(frames[0], settings);
  }
  const count = Math.min(PALETTE_SAMPLE_FRAMES, frames.length);
  const sampled = Array.from({ length: count }, (_, i) =>
    prepare(frames[Math.floor((i * frames.length) / count)], settings, true),
  );
  const { width, height } = sampled[0];
  const montage = createPixels(width, height * count);
  sampled.forEach((frame, i) =>
    montage.data.set(frame.data, i * frame.data.length),
  );
  return resolvePalette(montage, settings);
}

/**
 * Renders every frame of an animation with one shared palette. The worker
 * renders frame by frame instead (to report progress and stop early); this
 * is the same result in one call.
 */
export function renderAnimation(
  frames: Pixels[],
  settings: EditorSettings,
  { dither }: { dither: boolean },
  onFrame?: (index: number, result: RenderResult) => void,
): { frames: Pixels[]; palette: string[] | null } {
  const palette = dither
    ? resolveAnimationPalette(frames, settings)
    : undefined;
  const out = frames.map((frame, index) => {
    const result = renderPixels(frame, settings, { dither, palette });
    onFrame?.(index, result);
    return result.pixels;
  });
  return { frames: out, palette: palette ?? null };
}

function resolvePalette(pixels: Pixels, { color }: EditorSettings): string[] {
  if (color.palette === "extracted") {
    return extractPalette(pixels, color.extractCount);
  }
  if (color.palette === "custom") return color.custom;
  return [...getPalettePreset(color.palette)!.colors];
}
