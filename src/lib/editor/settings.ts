import { DEFAULT_ALGORITHM, type AlgorithmId } from "@/lib/algorithms";
import {
  DEFAULT_CUSTOM_COLORS,
  DEFAULT_EXTRACT_COUNT,
  type PaletteId,
  type PaletteMatch,
} from "@/lib/palettes";

export type Filters = {
  /** Levels: input value that becomes black (0–255). */
  blackPoint: number;
  /** Levels: input value that becomes white (0–255). */
  whitePoint: number;
  /** Levels: midtone gamma; above 1 lightens, below 1 darkens. */
  gamma: number;
  brightness: number;
  contrast: number;
  /** 1 = unchanged, 0 = grayscale, 2 = doubled. */
  saturation: number;
  blur: number;
  /** Unsharp mask amount; 0 = off. */
  sharpen: number;
  noise: number;
};

export type ToneSlot = "highlights" | "midtones" | "shadows";

export type Tone = {
  color: string;
  /** Upper luminance bound (0–255) of the slot. Highlights are fixed at 255. */
  range: number;
};

/** Smallest processing scale the editor allows. */
export const MIN_SCALE = 0.05;

/** A catalog algorithm, or "none": plain nearest-color quantization. */
export type DitherChoice = AlgorithmId | "none";

export type ColorSettings = {
  /** "mono": 1-bit dither + tone mapping. "palette": dither to a palette. */
  mode: "mono" | "palette";
  palette: PaletteId;
  match: PaletteMatch;
  /** Number of colors extracted when `palette` is "extracted". */
  extractCount: number;
  /** User-edited colors for the "custom" palette. */
  custom: string[];
};

export type EditorSettings = {
  algorithm: DitherChoice;
  /**
   * Processing scale (0.05–1): the image is dithered at this fraction of its
   * size. The result stays at that native size; the viewport and export
   * enlarge it without smoothing.
   */
  scale: number;
  /**
   * Share of each pixel's quantization error passed on to its neighbors
   * (0–1), for error diffusion algorithms only. 1 is the classic algorithm.
   */
  diffusion: number;
  filters: Filters;
  colorCount: 1 | 2 | 3;
  preserveLuminance: boolean;
  /**
   * Color of the "off" pixels in 1-bit mode, or null to leave them
   * transparent (a dither to lay over other artwork).
   */
  background: string | null;
  tones: Record<ToneSlot, Tone>;
  color: ColorSettings;
};

/** Range of each filter, shared by the sliders and shared-link validation. */
export const FILTER_LIMITS: Record<
  keyof Filters,
  { min: number; max: number }
> = {
  blackPoint: { min: 0, max: 254 },
  whitePoint: { min: 1, max: 255 },
  gamma: { min: 1 / 3, max: 3 },
  brightness: { min: 0, max: 2 },
  contrast: { min: -1, max: 1 },
  saturation: { min: 0, max: 2 },
  blur: { min: 0, max: 5 },
  sharpen: { min: 0, max: 3 },
  noise: { min: 0, max: 1 },
};

export const DEFAULT_FILTERS: Filters = {
  blackPoint: 0,
  whitePoint: 255,
  gamma: 1,
  brightness: 1,
  contrast: 0,
  saturation: 1,
  blur: 0,
  sharpen: 0,
  noise: 0,
};

export const DEFAULT_SETTINGS: EditorSettings = {
  algorithm: DEFAULT_ALGORITHM,
  scale: 1,
  diffusion: 1,
  filters: DEFAULT_FILTERS,
  colorCount: 1,
  preserveLuminance: false,
  background: "#000000",
  tones: {
    highlights: { color: "#FFFFFF", range: 255 },
    midtones: { color: "#E53935", range: 170 },
    shadows: { color: "#1E88E5", range: 85 },
  },
  color: {
    mode: "mono",
    palette: "pico8",
    match: "color",
    extractCount: DEFAULT_EXTRACT_COUNT,
    custom: DEFAULT_CUSTOM_COLORS,
  },
};

/**
 * Tone bands kept in order: the shadows band ends below the midtones band
 * (otherwise shadows would take over midtones and part of the highlights).
 * Used when a third dot color comes in with ranges set for two.
 */
export function orderedTones(
  tones: EditorSettings["tones"],
): EditorSettings["tones"] {
  if (tones.shadows.range < tones.midtones.range) return tones;
  const midtones = Math.max(1, tones.midtones.range);
  return {
    ...tones,
    midtones: { ...tones.midtones, range: midtones },
    shadows: { ...tones.shadows, range: midtones - 1 },
  };
}

export function hasLevels(filters: Filters) {
  return (
    filters.blackPoint !== DEFAULT_FILTERS.blackPoint ||
    filters.whitePoint !== DEFAULT_FILTERS.whitePoint ||
    filters.gamma !== DEFAULT_FILTERS.gamma
  );
}

export function hasActiveFilters(filters: Filters) {
  return (
    hasLevels(filters) ||
    filters.sharpen > DEFAULT_FILTERS.sharpen ||
    filters.contrast !== DEFAULT_FILTERS.contrast ||
    filters.brightness !== DEFAULT_FILTERS.brightness ||
    filters.saturation !== DEFAULT_FILTERS.saturation ||
    filters.noise > DEFAULT_FILTERS.noise ||
    filters.blur > DEFAULT_FILTERS.blur
  );
}
