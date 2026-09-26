import { createRandom, type Pixels } from "./pixels";
import { DEFAULT_FILTERS, hasLevels, type Filters } from "./settings";

/** Blur radius (sigma, in pixels) of the unsharp mask behind "sharpen". */
const SHARPEN_SIGMA = 1;

/**
 * Applies levels → sharpen → contrast → brightness → saturation → noise →
 * blur in place, in that order. Levels maps the black and white points to
 * 0 and 255 with a midtone gamma. Contrast pivots around mid-gray;
 * brightness is a multiplier (1 = neutral); saturation scales each color's
 * distance from its luma.
 */
export function applyFilters(pixels: Pixels, filters: Filters, seed = 1) {
  const { data } = pixels;
  const { contrast, brightness, saturation, noise, blur, sharpen } = filters;

  if (hasLevels(filters)) applyLevels(pixels, filters);
  if (sharpen > 0) unsharpMask(pixels, sharpen);

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

/** Levels on R, G and B alike, through a 256-entry lookup table. */
export function applyLevels(
  { data }: Pixels,
  { blackPoint, whitePoint, gamma }: Filters,
) {
  // Keep at least one step between the points, whatever the input.
  const black = Math.min(254, Math.max(0, blackPoint));
  const white = Math.max(black + 1, Math.min(255, whitePoint));
  const exponent = 1 / gamma;
  const table = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    const t = Math.min(1, Math.max(0, (v - black) / (white - black)));
    table[v] = Math.round(255 * t ** exponent);
  }
  for (let i = 0; i < data.length; i += 4) {
    data[i] = table[data[i]];
    data[i + 1] = table[data[i + 1]];
    data[i + 2] = table[data[i + 2]];
  }
}

/**
 * Unsharp mask: pushes every pixel away from its blurred neighborhood by
 * `amount` (1 doubles the local contrast of fine detail). Alpha is kept.
 */
export function unsharpMask(pixels: Pixels, amount: number) {
  const blurred = { ...pixels, data: new Uint8ClampedArray(pixels.data) };
  gaussianBlur(blurred, SHARPEN_SIGMA);
  const { data } = pixels;
  for (let i = 0; i < data.length; i += 4) {
    for (let c = i; c < i + 3; c++) {
      data[c] = data[c] + (data[c] - blurred.data[c]) * amount;
    }
  }
}

/**
 * Below this sigma the blur uses an exact Gaussian kernel: three box blurs
 * all round down to radius 0 there (nothing happens below ~0.58), and the
 * kernel is still small.
 */
const EXACT_BLUR_MAX_SIGMA = 2;

/**
 * Gaussian blur, separable: an exact kernel for small sigmas, three
 * successive box blurs (O(n) regardless of radius) for larger ones.
 * Operates on RGB; alpha is left untouched.
 */
export function gaussianBlur(pixels: Pixels, sigma: number) {
  if (sigma <= 0) return;
  if (sigma < EXACT_BLUR_MAX_SIGMA) return kernelBlur(pixels, sigma);
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

/** Separable blur with a sampled, normalized Gaussian kernel. */
function kernelBlur(pixels: Pixels, sigma: number) {
  const { width, height, data } = pixels;
  const radius = Math.ceil(sigma * 3);
  const kernel = new Float32Array(2 * radius + 1);
  let total = 0;
  for (let k = -radius; k <= radius; k++) {
    total += kernel[k + radius] = Math.exp(-(k * k) / (2 * sigma * sigma));
  }
  for (let k = 0; k < kernel.length; k++) kernel[k] /= total;

  const row = new Float32Array(width * height * 3);
  // Horizontal pass into `row`, vertical pass back into `data`; edges clamp.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let k = -radius; k <= radius; k++) {
        const i = (y * width + Math.min(width - 1, Math.max(0, x + k))) * 4;
        const w = kernel[k + radius];
        r += data[i] * w;
        g += data[i + 1] * w;
        b += data[i + 2] * w;
      }
      const o = (y * width + x) * 3;
      row[o] = r;
      row[o + 1] = g;
      row[o + 2] = b;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let k = -radius; k <= radius; k++) {
        const o = (Math.min(height - 1, Math.max(0, y + k)) * width + x) * 3;
        const w = kernel[k + radius];
        r += row[o] * w;
        g += row[o + 1] * w;
        b += row[o + 2] * w;
      }
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
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
