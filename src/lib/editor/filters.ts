import { createRandom, type Pixels } from "./pixels";
import { DEFAULT_FILTERS, type Filters } from "./settings";

/**
 * Applies contrast → brightness → saturation → noise → blur in place, in
 * that order. Contrast pivots around mid-gray; brightness is a multiplier
 * (1 = neutral); saturation scales each color's distance from its luma.
 */
export function applyFilters(pixels: Pixels, filters: Filters, seed = 1) {
  const { data } = pixels;
  const { contrast, brightness, saturation, noise, blur } = filters;

  if (
    contrast !== DEFAULT_FILTERS.contrast ||
    brightness !== DEFAULT_FILTERS.brightness ||
    saturation !== DEFAULT_FILTERS.saturation ||
    noise > 0
  ) {
    const gain = (1 + contrast) * brightness;
    const offset = -127.5 * contrast * brightness;
    const random = createRandom(seed);
    const noiseAmount = noise * 255;

    for (let i = 0; i < data.length; i += 4) {
      const n = noise > 0 ? (0.5 - random()) * noiseAmount : 0;
      const r = data[i] * gain + offset;
      const g = data[i + 1] * gain + offset;
      const b = data[i + 2] * gain + offset;
      if (saturation === 1) {
        data[i] = r + n;
        data[i + 1] = g + n;
        data[i + 2] = b + n;
      } else {
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = l + (r - l) * saturation + n;
        data[i + 1] = l + (g - l) * saturation + n;
        data[i + 2] = l + (b - l) * saturation + n;
      }
    }
  }

  if (blur > 0) gaussianBlur(pixels, blur * 0.65);
}

/**
 * Gaussian blur approximated by three successive box blurs (separable,
 * O(n) regardless of radius). Operates on RGB; alpha is left untouched.
 */
export function gaussianBlur(pixels: Pixels, sigma: number) {
  if (sigma < 0.2) return;
  const { width, height, data } = pixels;
  const size = width * height;
  const channels = [0, 1, 2].map((c) => {
    const channel = new Float32Array(size);
    for (let p = 0; p < size; p++) channel[p] = data[p * 4 + c];
    return channel;
  });
  const scratch = new Float32Array(size);

  for (const radius of boxRadii(sigma)) {
    for (const channel of channels) {
      boxBlurHorizontal(channel, scratch, width, height, radius);
      boxBlurVertical(scratch, channel, width, height, radius);
    }
  }

  for (let c = 0; c < 3; c++) {
    const channel = channels[c];
    for (let p = 0; p < size; p++) data[p * 4 + c] = channel[p];
  }
}

/** Radii of 3 box blurs whose composition approximates a Gaussian of `sigma`. */
function boxRadii(sigma: number) {
  const n = 3;
  const ideal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let lower = Math.floor(ideal);
  if (lower % 2 === 0) lower--;
  const upper = lower + 2;
  const m = Math.round(
    (12 * sigma * sigma - n * lower * lower - 4 * n * lower - 3 * n) /
      (-4 * lower - 4),
  );
  return Array.from({ length: n }, (_, i) => ((i < m ? lower : upper) - 1) / 2);
}

function boxBlurHorizontal(
  src: Float32Array,
  dst: Float32Array,
  width: number,
  height: number,
  radius: number,
) {
  const scale = 1 / (2 * radius + 1);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      sum += src[row + Math.min(width - 1, Math.max(0, k))];
    }
    for (let x = 0; x < width; x++) {
      dst[row + x] = sum * scale;
      const add = Math.min(width - 1, x + radius + 1);
      const remove = Math.max(0, x - radius);
      sum += src[row + add] - src[row + remove];
    }
  }
}

function boxBlurVertical(
  src: Float32Array,
  dst: Float32Array,
  width: number,
  height: number,
  radius: number,
) {
  const scale = 1 / (2 * radius + 1);
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      sum += src[Math.min(height - 1, Math.max(0, k)) * width + x];
    }
    for (let y = 0; y < height; y++) {
      dst[y * width + x] = sum * scale;
      const add = Math.min(height - 1, y + radius + 1);
      const remove = Math.max(0, y - radius);
      sum += src[add * width + x] - src[remove * width + x];
    }
  }
}
