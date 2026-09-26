import type { PaletteMatch } from "@/lib/palettes";
import { getMethod, RANDOM_SEED } from "./dither";
import {
  createPixels,
  createRandom,
  hexToRgb,
  luminance,
  type Pixels,
} from "./pixels";
import { screenThreshold } from "./screen";
import {
  DEFAULT_SETTINGS,
  type DitherChoice,
  type ScreenSettings,
} from "./settings";

type Rgb = [number, number, number];

const luma = ([r, g, b]: Rgb) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * Dithers an image to a fixed palette.
 *
 * - `match: "color"` diffuses error per RGB channel and picks the
 *   perceptually nearest color ("redmean" distance).
 * - `match: "brightness"` sorts the palette dark → light, spreads it evenly
 *   over 0–255 and dithers the luminance along that ramp.
 *
 * Halftone screens draw darker dots between each pair of neighboring colors.
 * Alpha is copied from the source.
 */
export function ditherToPalette(
  src: Pixels,
  algorithm: DitherChoice,
  colors: readonly string[],
  match: PaletteMatch,
  diffusion = 1,
  screen: ScreenSettings = DEFAULT_SETTINGS.screen,
): Pixels {
  const palette = colors.map(hexToRgb);
  const out = createPixels(src.width, src.height);
  const indices =
    match === "brightness"
      ? ditherRamp(src, algorithm, palette, diffusion, screen)
      : ditherColor(src, algorithm, palette, diffusion, screen);
  const ramp =
    match === "brightness"
      ? [...palette].sort((a, b) => luma(a) - luma(b))
      : palette;

  for (let p = 0, i = 0; p < indices.length; p++, i += 4) {
    const [r, g, b] = ramp[indices[p]];
    out.data[i] = r;
    out.data[i + 1] = g;
    out.data[i + 2] = b;
    out.data[i + 3] = src.data[i + 3];
  }
  return out;
}

/** Index into the luminance-sorted palette for every pixel. */
function ditherRamp(
  src: Pixels,
  algorithm: DitherChoice,
  palette: Rgb[],
  diffusion: number,
  screen: ScreenSettings,
): Uint8Array {
  const { width, height } = src;
  const levels = palette.length;
  const step = 255 / (levels - 1);
  const gray = luminance(src);
  const out = new Uint8Array(width * height);
  const method = getMethod(algorithm);
  const quantize = (v: number) =>
    Math.min(levels - 1, Math.max(0, Math.round(v / step)));

  if (method.kind === "diffusion") {
    const { kernel, serpentine } = method;
    for (let y = 0; y < height; y++) {
      const reverse = serpentine && y % 2 === 1;
      const dir = reverse ? -1 : 1;
      for (let s = 0; s < width; s++) {
        const x = reverse ? width - 1 - s : s;
        const p = y * width + x;
        const index = quantize(gray[p]);
        const unit = ((gray[p] - index * step) / kernel.divisor) * diffusion;
        out[p] = index;
        for (const [dx, dy, weight] of kernel.taps) {
          const nx = x + dx * dir;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny < height) {
            gray[ny * width + nx] += unit * weight;
          }
        }
      }
    }
    return out;
  }

  const offset = thresholdOffsets(method, width, screen);
  for (let p = 0; p < out.length; p++) {
    out[p] = quantize(gray[p] + offset(p) * step);
  }
  return out;
}

/** Index into the palette (original order) for every pixel. */
function ditherColor(
  src: Pixels,
  algorithm: DitherChoice,
  palette: Rgb[],
  diffusion: number,
  screen: ScreenSettings,
): Uint8Array {
  const { width, height, data } = src;
  const size = width * height;
  const out = new Uint8Array(size);
  const method = getMethod(algorithm);
  const nearest = createNearest(palette);

  if (method.kind === "diffusion") {
    const buffer = new Float32Array(size * 3);
    for (let p = 0; p < size; p++) {
      buffer[p * 3] = data[p * 4];
      buffer[p * 3 + 1] = data[p * 4 + 1];
      buffer[p * 3 + 2] = data[p * 4 + 2];
    }
    const { kernel, serpentine } = method;
    const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

    for (let y = 0; y < height; y++) {
      const reverse = serpentine && y % 2 === 1;
      const dir = reverse ? -1 : 1;
      for (let s = 0; s < width; s++) {
        const x = reverse ? width - 1 - s : s;
        const p = y * width + x;
        // Clamping before matching keeps accumulated error from running away
        // when the palette can't reach a color (e.g. no pure white).
        const r = clamp(buffer[p * 3]);
        const g = clamp(buffer[p * 3 + 1]);
        const b = clamp(buffer[p * 3 + 2]);
        const index = nearest(r, g, b);
        const [pr, pg, pb] = palette[index];
        out[p] = index;
        const er = ((r - pr) / kernel.divisor) * diffusion;
        const eg = ((g - pg) / kernel.divisor) * diffusion;
        const eb = ((b - pb) / kernel.divisor) * diffusion;
        for (const [dx, dy, weight] of kernel.taps) {
          const nx = x + dx * dir;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny < height) {
            const q = (ny * width + nx) * 3;
            buffer[q] += er * weight;
            buffer[q + 1] += eg * weight;
            buffer[q + 2] += eb * weight;
          }
        }
      }
    }
    return out;
  }

  // Threshold methods nudge every channel by the same amount; the spread
  // shrinks as the palette gets denser.
  const spread = 255 / Math.sqrt(palette.length);
  const offset = thresholdOffsets(method, width, screen);
  for (let p = 0; p < size; p++) {
    const t = offset(p) * spread;
    out[p] = nearest(data[p * 4] + t, data[p * 4 + 1] + t, data[p * 4 + 2] + t);
  }
  return out;
}

/**
 * Per-pixel threshold offset in [-0.5, 0.5) for ordered, screen, random and
 * none.
 */
function thresholdOffsets(
  method: ReturnType<typeof getMethod>,
  width: number,
  screen: ScreenSettings,
): (p: number) => number {
  if (method.kind === "ordered") {
    const { size, ranks } = method.matrix();
    const levels = size * size;
    return (p) => {
      const x = p % width;
      const y = (p / width) | 0;
      return (ranks[(y % size) * size + (x % size)] + 0.5) / levels - 0.5;
    };
  }
  if (method.kind === "screen") {
    // Ink dots: the cell center rounds to the darker color first.
    const threshold = screenThreshold(
      screen,
      method.lines ? "line" : screen.shape,
      false,
    );
    return (p) => 0.5 - threshold(p % width, (p / width) | 0);
  }
  if (method.kind === "random") {
    const random = createRandom(RANDOM_SEED);
    return () => random() - 0.5;
  }
  return () => 0;
}

/**
 * Nearest palette color by "redmean" distance, a cheap perceptual weighting
 * of RGB. Results are cached on a 5-bit-per-channel grid, which is exact
 * enough for matching and makes large images fast.
 */
function createNearest(palette: Rgb[]) {
  const cache = new Int16Array(32 * 32 * 32).fill(-1);
  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

  return (r: number, g: number, b: number) => {
    r = clamp(r);
    g = clamp(g);
    b = clamp(b);
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const cached = cache[key];
    if (cached >= 0) return cached;

    let best = 0;
    let bestDistance = Infinity;
    for (let k = 0; k < palette.length; k++) {
      const [pr, pg, pb] = palette[k];
      const mean = (r + pr) / 2;
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const distance =
        (2 + mean / 256) * dr * dr +
        4 * dg * dg +
        (2 + (255 - mean) / 256) * db * db;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = k;
      }
    }
    cache[key] = best;
    return best;
  };
}

/**
 * Extracts a palette from an image with median cut: repeatedly split the box
 * of colors with the widest channel range at its median. Works on a sample
 * of opaque pixels; returns colors sorted dark → light.
 */
export function extractPalette(src: Pixels, count: number): string[] {
  const total = src.width * src.height;
  const stride = Math.max(1, Math.floor(total / 40_000));
  const samples: Rgb[] = [];
  for (let p = 0; p < total; p += stride) {
    const i = p * 4;
    if (src.data[i + 3] >= 128) {
      samples.push([src.data[i], src.data[i + 1], src.data[i + 2]]);
    }
  }
  if (samples.length === 0) return ["#000000", "#ffffff"];

  let boxes: Rgb[][] = [samples];
  while (boxes.length < count) {
    let widest = -1;
    let widestRange = 0;
    let widestChannel = 0;
    boxes.forEach((box, i) => {
      if (box.length < 2) return;
      for (let c = 0; c < 3; c++) {
        let min = 255;
        let max = 0;
        for (const color of box) {
          if (color[c] < min) min = color[c];
          if (color[c] > max) max = color[c];
        }
        if (max - min > widestRange) {
          widestRange = max - min;
          widest = i;
          widestChannel = c;
        }
      }
    });
    if (widest < 0) break; // every box is a single color
    const box = boxes[widest].sort(
      (a, b) => a[widestChannel] - b[widestChannel],
    );
    const half = box.length >> 1;
    boxes = [
      ...boxes.slice(0, widest),
      box.slice(0, half),
      box.slice(half),
      ...boxes.slice(widest + 1),
    ];
  }

  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return boxes
    .map((box) => {
      const sum = box.reduce<Rgb>(
        (acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b],
        [0, 0, 0],
      );
      return sum.map((v) => v / box.length) as Rgb;
    })
    .sort((a, b) => luma(a) - luma(b))
    .map(([r, g, b]) => `#${toHex(r)}${toHex(g)}${toHex(b)}`);
}
