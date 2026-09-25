import { DEFAULT_ALGORITHM, type AlgorithmId } from "@/lib/algorithms";

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

export type EditorSettings = {
  algorithm: AlgorithmId;
  /** Processing scale (0.05–1): dither at a lower resolution, then upscale. */
  scale: number;
  filters: Filters;
  colorCount: 1 | 2 | 3;
  preserveLuminance: boolean;
  tones: Record<ToneSlot, Tone>;
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
};

export function hasActiveFilters(filters: Filters) {
  return (
    filters.contrast !== DEFAULT_FILTERS.contrast ||
    filters.brightness !== DEFAULT_FILTERS.brightness ||
    filters.noise > DEFAULT_FILTERS.noise ||
    filters.blur > DEFAULT_FILTERS.blur
  );
}
