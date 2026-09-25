import type { AlgorithmId } from "@/lib/algorithms";
import { createRandom } from "./pixels";
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
  | { kind: "random" };

const lazy = <T>(make: () => T) => {
  let value: T | undefined;
  return () => (value ??= make());
};

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
    matrix: lazy(() => voidAndCluster(64, 1.9, 11)),
  },
  "random-dither": { kind: "random" },
  // Classic small void-and-cluster array: organic, with a faint period.
  "void-and-cluster": {
    kind: "ordered",
    matrix: lazy(() => voidAndCluster(16, 1.5, 7)),
  },
};

/**
 * Converts a luminance buffer (0–255) into a 1-bit image (0 or 255 per pixel).
 * Error diffusion works on a float copy, so accumulated error is never
 * clipped — the classic bug when diffusing into 8-bit storage.
 */
export function dither(
  gray: Float32Array,
  width: number,
  height: number,
  algorithm: AlgorithmId,
): Uint8Array {
  const method = METHODS[algorithm];
  const out = new Uint8Array(width * height);

  if (method.kind === "ordered") {
    const { size, ranks } = method.matrix();
    const levels = size * size;
    for (let y = 0; y < height; y++) {
      const row = (y % size) * size;
      for (let x = 0; x < width; x++) {
        const threshold = ((ranks[row + (x % size)] + 0.5) / levels) * 255;
        out[y * width + x] = gray[y * width + x] < threshold ? 0 : 255;
      }
    }
    return out;
  }

  if (method.kind === "random") {
    // Seeded, so tweaking another setting doesn't reshuffle the grain.
    const random = createRandom(0x5eed);
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
      const value = buffer[p] < 128 ? 0 : 255;
      const error = buffer[p] - value;
      out[p] = value;

      for (const [dx, dy, weight] of kernel) {
        const nx = x + dx * dir;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny < height) {
          buffer[ny * width + nx] += error * weight;
        }
      }
    }
  }
  return out;
}
