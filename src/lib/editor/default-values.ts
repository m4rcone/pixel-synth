import { DitherAlgorithm } from "../enum/dither-algorithm";

export const DEFAULT_DITHER_SCALE = 1.0;
export const DEFAULT_DITHER_ALGORITHM = DitherAlgorithm.FloydSteinberg;

export const DEFAULT_FILTERS = {
  brightness: 1,
  contrast: 0,
  blur: 0,
  noise: 0,
};

export const DEFAULT_COLOR_COUNT = 1;
export const DEFAULT_COLORS = {
  highlights: "#FFFFFF",
  midtones: "#E53935",
  shadows: "#1E88E5",
};
export const DEFAULT_TONE_RANGE = {
  highlights: 255,
  midtones: 170,
  shadows: 85,
};
