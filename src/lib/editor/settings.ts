import { DEFAULT_ALGORITHM, type AlgorithmId } from "@/lib/algorithms";
import {
  DEFAULT_CUSTOM_COLORS,
  DEFAULT_EXTRACT_COUNT,
  type PaletteId,
  type PaletteMatch,
} from "@/lib/palettes";

export type Filters = {
  brightness: number;
  contrast: number;
  blur: number;
  noise: number;
};

export type ToneSlot = "highlights" | "midtones" | "shadows";

export type Tone = {
  color: string;
  /** Upper luminance bound (0–255) of the slot. Highlights are fixed at 255. */
  range: number;
};

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
  filters: Filters;
  colorCount: 1 | 2 | 3;
  preserveLuminance: boolean;
  tones: Record<ToneSlot, Tone>;
  color: ColorSettings;
};

export const DEFAULT_FILTERS: Filters = {
  brightness: 1,
  contrast: 0,
  blur: 0,
  noise: 0,
};

export const DEFAULT_SETTINGS: EditorSettings = {
  algorithm: DEFAULT_ALGORITHM,
  scale: 1,
  filters: DEFAULT_FILTERS,
  colorCount: 1,
  preserveLuminance: false,
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

export function hasActiveFilters(filters: Filters) {
  return (
    filters.contrast !== DEFAULT_FILTERS.contrast ||
    filters.brightness !== DEFAULT_FILTERS.brightness ||
    filters.noise > DEFAULT_FILTERS.noise ||
    filters.blur > DEFAULT_FILTERS.blur
  );
}
