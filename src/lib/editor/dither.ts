import type { AlgorithmId } from "@/lib/algorithms";
import { createRandom } from "./pixels";
import { warpedScreenThreshold } from "./screen";
import {
  DEFAULT_SETTINGS,
  type DitherChoice,
  type ScreenSettings,
} from "./settings";
import {
  bayerMatrix,
  CLUSTERED_DOT_4,
  ERROR_KERNELS,
  voidAndCluster,
  type ErrorKernel,
  type ThresholdMatrix,
} from "./matrices";

type Method =
  | { kind: "diffusion"; kernel: ErrorKernel; serpentine: boolean }
  | { kind: "ordered"; matrix: () => ThresholdMatrix }
  | { kind: "random" }
  /** Halftone screen: dots (of the chosen shape) or lines. */
  | { kind: "screen"; lines: boolean }
  | { kind: "none" };

const lazy = <T>(make: () => T) => {
  let value: T | undefined;
  return () => (value ??= make());
};

/**
 * The large blue-noise mask behind Blue Noise; tone mapping also uses it to
 * blend band colors.
 */
export const blueNoiseMatrix = lazy(() => voidAndCluster(64, 1.9, 11));

const METHODS: Record<AlgorithmId, Method> = {
  "floyd-steinberg": {
    kind: "diffusion",
    kernel: ERROR_KERNELS.floydSteinberg,
    serpentine: true,
  },
  "jarvis-judice-and-ninke-jjn": {
    kind: "diffusion",
    kernel: ERROR_KERNELS.jarvisJudiceNinke,
    serpentine: true,
  },
  stucki: { kind: "diffusion", kernel: ERROR_KERNELS.stucki, serpentine: true },
  burkes: { kind: "diffusion", kernel: ERROR_KERNELS.burkes, serpentine: true },
  sierra: { kind: "diffusion", kernel: ERROR_KERNELS.sierra, serpentine: true },
  "two-row-sierra": {
    kind: "diffusion",
    kernel: ERROR_KERNELS.twoRowSierra,
    serpentine: true,
  },
  "sierra-lite": {
    kind: "diffusion",
    kernel: ERROR_KERNELS.sierraLite,
    serpentine: true,
  },
  atkinson: {
    kind: "diffusion",
    kernel: ERROR_KERNELS.atkinson,
    serpentine: false,
  },
  "bayer-2-2": { kind: "ordered", matrix: lazy(() => bayerMatrix(2)) },
  "bayer-4-4": { kind: "ordered", matrix: lazy(() => bayerMatrix(4)) },
  "bayer-8-8": { kind: "ordered", matrix: lazy(() => bayerMatrix(8)) },
  "clustered-dot-halftone-ordered": {
    kind: "ordered",
    matrix: () => CLUSTERED_DOT_4,
  },
  // Large blue-noise mask: no visible tiling.
  "blue-noise": {
    kind: "ordered",
    matrix: blueNoiseMatrix,
  },
  "random-dither": { kind: "random" },
  // Classic small void-and-cluster array: organic, with a faint period.
  "void-and-cluster": {
    kind: "ordered",
    matrix: lazy(() => voidAndCluster(16, 1.5, 7)),
  },
  halftone: { kind: "screen", lines: false },
  "line-screen": { kind: "screen", lines: true },
};

export type AlgorithmMethod = Method;

/** How an algorithm works: for the engine and for documentation pages. */
export function getMethod(algorithm: DitherChoice): Method {
  return algorithm === "none" ? { kind: "none" } : METHODS[algorithm];
}

/** Seed shared by every random dither so grain is stable across renders. */
export const RANDOM_SEED = 0x5eed;

/**
 * Mask shift per phase step: odd and unequal, so successive phases land on
 * different cells of every mask size (2 to 64).
 */
const PHASE_SHIFT_X = 29;
const PHASE_SHIFT_Y = 17;

/** A screen's parameters and which way its dots point. */
export type ScreenOptions = ScreenSettings & {
  /**
   * Lit pixels form the dots (light dots on a dark background) instead of
   * unlit ones (ink on paper).
   */
  light: boolean;
};

/**
 * Converts a luminance buffer (0–255) into a 1-bit image (0 or 255 per pixel).
 * Error diffusion works on a float copy, so accumulated error is never
 * clipped — the classic bug when diffusing into 8-bit storage. `diffusion`
 * scales the error passed on (1 = the classic algorithm); `screen` shapes
 * the halftone screens. `phase` shifts the threshold mask and reseeds random
 * dither, so layers dithered with the same algorithm (CMYK inks) don't all
 * put their dots on the same pixels. Error diffusion skips the pixels marked
 * in `transparent` (see `transparentMask`).
 */
export function dither(
  gray: Float32Array,
  width: number,
  height: number,
  algorithm: DitherChoice,
  diffusion = 1,
  screen: ScreenOptions = { ...DEFAULT_SETTINGS.screen, light: false },
  phase = 0,
  transparent: Uint8Array | null = null,
): Uint8Array {
  const method = getMethod(algorithm);
  const out = new Uint8Array(width * height);

  if (method.kind === "screen") {
    const threshold = warpedScreenThreshold(
      screen,
      method.lines ? "line" : screen.shape,
      screen.light,
      { gray, width, height },
    );
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        out[p] = gray[p] < threshold(x, y) * 255 ? 0 : 255;
      }
    }
    return out;
  }

  if (method.kind === "none") {
    for (let p = 0; p < out.length; p++) out[p] = gray[p] < 128 ? 0 : 255;
    return out;
  }

  if (method.kind === "ordered") {
    const { size, ranks } = method.matrix();
    const levels = size * size;
    const shiftX = phase * PHASE_SHIFT_X;
    const shiftY = phase * PHASE_SHIFT_Y;
    for (let y = 0; y < height; y++) {
      const row = ((y + shiftY) % size) * size;
      for (let x = 0; x < width; x++) {
        const threshold =
          ((ranks[row + ((x + shiftX) % size)] + 0.5) / levels) * 255;
        out[y * width + x] = gray[y * width + x] < threshold ? 0 : 255;
      }
    }
    return out;
  }

  if (method.kind === "random") {
    // Seeded, so tweaking another setting doesn't reshuffle the grain.
    const random = createRandom(RANDOM_SEED + phase);
    for (let p = 0; p < out.length; p++) {
      out[p] = gray[p] < random() * 255 ? 0 : 255;
    }
    return out;
  }

  const buffer = Float32Array.from(gray);
  const { kernel, serpentine } = method;

  for (let y = 0; y < height; y++) {
    const reverse = serpentine && y % 2 === 1;
    const dir = reverse ? -1 : 1;
    for (let step = 0; step < width; step++) {
      const x = reverse ? width - 1 - step : step;
      const p = y * width + x;
      if (transparent?.[p]) continue;
      const value = buffer[p] < 128 ? 0 : 255;
      const unit = ((buffer[p] - value) / kernel.divisor) * diffusion;
      out[p] = value;

      for (const [dx, dy, weight] of kernel.taps) {
        const nx = x + dx * dir;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny < height) {
          buffer[ny * width + nx] += unit * weight;
        }
      }
    }
  }
  return out;
}
