import { DEFAULT_ALGORITHM, type AlgorithmId } from "@/lib/algorithms";
import { hexToRgb } from "./pixels";
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

export const SCREEN_SHAPES = ["round", "square", "diamond"] as const;

export type ScreenShape = (typeof SCREEN_SHAPES)[number];

/** Halftone screen parameters, for the Halftone screen algorithms only. */
export type ScreenSettings = {
  /** Distance between dot (or line) centers, in processed pixels. */
  size: number;
  /** Screen angle in degrees, counterclockwise from horizontal (0–180). */
  angle: number;
  /** Dot shape (Halftone); Line Screen always draws lines. */
  shape: ScreenShape;
  /**
   * Line Screen: how far the brightest areas push the lines across their
   * direction, in line spacings (0 = straight lines).
   */
  displace: number;
  /** Line Screen: amplitude of a sine wave along the lines, in line spacings. */
  wave: number;
  /** Line Screen: length of one wave, in line spacings. */
  wavelength: number;
};

/** Range of the screen parameters, shared by the sliders and shared links. */
export const SCREEN_LIMITS = {
  size: { min: 4, max: 64 },
  angle: { min: 0, max: 180 },
  displace: { min: 0, max: 4 },
  wave: { min: 0, max: 2 },
  wavelength: { min: 2, max: 64 },
} as const;

/** Smallest processing scale the editor allows. */
export const MIN_SCALE = 0.05;

/** A catalog algorithm, or "none": plain nearest-color quantization. */
export type DitherChoice = AlgorithmId | "none";

export const COLOR_MODES = ["mono", "palette", "cmyk"] as const;

export type ColorSettings = {
  /**
   * "mono": 1-bit dither + tone mapping. "palette": dither to a palette.
   * "cmyk": each process ink dithered on its own, overprinted on paper.
   */
  mode: (typeof COLOR_MODES)[number];
  palette: PaletteId;
  match: PaletteMatch;
  /** Number of colors extracted when `palette` is "extracted". */
  extractCount: number;
  /** User-edited colors for the "custom" palette. */
  custom: string[];
  /**
   * CMYK: share (0–1) of the gray that cyan, magenta and yellow have in
   * common that black ink prints instead (gray component replacement).
   */
  black: number;
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
  screen: ScreenSettings;
  filters: Filters;
  colorCount: 1 | 2 | 3;
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
  screen: {
    size: 8,
    angle: 45,
    shape: "round",
    displace: 0,
    wave: 0,
    wavelength: 12,
  },
  filters: DEFAULT_FILTERS,
  colorCount: 1,
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
    black: 0.5,
  },
};

const luma = ([r, g, b]: [number, number, number]) =>
  0.299 * r + 0.587 * g + 0.114 * b;

/**
 * Whether 1-bit dots mark the dark areas (ink on a lighter background)
 * rather than the light ones. Dots darker than the background are ink; with
 * a transparent background, dark dots are.
 */
export function dotsAreInk({
  tones,
  colorCount,
  background,
}: Pick<EditorSettings, "tones" | "colorCount" | "background">) {
  const active = [tones.highlights, tones.midtones, tones.shadows].slice(
    0,
    colorCount,
  );
  const dots =
    active.reduce((sum, tone) => sum + luma(hexToRgb(tone.color)), 0) /
    active.length;
  return background ? luma(hexToRgb(background)) > dots : dots < 128;
}

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
