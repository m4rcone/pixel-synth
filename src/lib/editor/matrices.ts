import { createRandom } from "./pixels";

/**
 * Error-diffusion kernel as published: integer weights over a divisor, at
 * offsets (dx, dy) from the current pixel. Kept in this form so the site can
 * display it exactly as the engine uses it.
 */
export type ErrorKernel = {
  divisor: number;
  taps: readonly (readonly [dx: number, dy: number, weight: number])[];
};

const kernel = (
  divisor: number,
  taps: [number, number, number][],
): ErrorKernel => ({ divisor, taps });

export const ERROR_KERNELS = {
  floydSteinberg: kernel(16, [
    [1, 0, 7],
    [-1, 1, 3],
    [0, 1, 5],
    [1, 1, 1],
  ]),
  jarvisJudiceNinke: kernel(48, [
    [1, 0, 7],
    [2, 0, 5],
    [-2, 1, 3],
    [-1, 1, 5],
    [0, 1, 7],
    [1, 1, 5],
    [2, 1, 3],
    [-2, 2, 1],
    [-1, 2, 3],
    [0, 2, 5],
    [1, 2, 3],
    [2, 2, 1],
  ]),
  stucki: kernel(42, [
    [1, 0, 8],
    [2, 0, 4],
    [-2, 1, 2],
    [-1, 1, 4],
    [0, 1, 8],
    [1, 1, 4],
    [2, 1, 2],
    [-2, 2, 1],
    [-1, 2, 2],
    [0, 2, 4],
    [1, 2, 2],
    [2, 2, 1],
  ]),
  burkes: kernel(32, [
    [1, 0, 8],
    [2, 0, 4],
    [-2, 1, 2],
    [-1, 1, 4],
    [0, 1, 8],
    [1, 1, 4],
    [2, 1, 2],
  ]),
  sierra: kernel(32, [
    [1, 0, 5],
    [2, 0, 3],
    [-2, 1, 2],
    [-1, 1, 4],
    [0, 1, 5],
    [1, 1, 4],
    [2, 1, 2],
    [-1, 2, 2],
    [0, 2, 3],
    [1, 2, 2],
  ]),
  twoRowSierra: kernel(16, [
    [1, 0, 4],
    [2, 0, 3],
    [-2, 1, 1],
    [-1, 1, 2],
    [0, 1, 3],
    [1, 1, 2],
    [2, 1, 1],
  ]),
  sierraLite: kernel(4, [
    [1, 0, 2],
    [0, 1, 1],
    [1, 1, 1],
  ]),
  // Atkinson intentionally diffuses only 6/8 of the error (crisper highlights).
  atkinson: kernel(8, [
    [1, 0, 1],
    [2, 0, 1],
    [-1, 1, 1],
    [0, 1, 1],
    [1, 1, 1],
    [0, 2, 1],
  ]),
} satisfies Record<string, ErrorKernel>;

/** Threshold matrix: `size`×`size` ranks 0…size²−1, row-major. */
export type ThresholdMatrix = { size: number; ranks: Uint16Array };

const matrix = (rows: number[][]): ThresholdMatrix => ({
  size: rows.length,
  ranks: Uint16Array.from(rows.flat()),
});

/** Recursive Bayer index matrix of size 2ⁿ. */
export function bayerMatrix(size: number): ThresholdMatrix {
  let m = [[0]];
  while (m.length < size) {
    const n = m.length;
    m = Array.from({ length: n * 2 }, (_, y) =>
      Array.from({ length: n * 2 }, (_, x) => {
        const quadrant = [0, 2, 3, 1][(y >= n ? 2 : 0) + (x >= n ? 1 : 0)];
        return 4 * m[y % n][x % n] + quadrant;
      }),
    );
  }
  return matrix(m);
}

export const CLUSTERED_DOT_4 = matrix([
  [14, 10, 11, 15],
  [9, 4, 5, 12],
  [8, 3, 0, 6],
  [13, 7, 2, 1],
]);

/**
 * Void-and-cluster dither array (Ulichney, 1993). Produces a blue-noise
 * threshold matrix: ranks spread so every threshold level is as evenly
 * distributed as possible, without the grid artifacts of Bayer matrices.
 *
 * Energy of a pixel = Gaussian-weighted count of nearby minority pixels on a
 * torus. The tightest cluster is the minority pixel with the most energy; the
 * largest void is the majority pixel with the least.
 */
export function voidAndCluster(
  size: number,
  sigma = 1.5,
  seed = 7,
): ThresholdMatrix {
  const n = size * size;
  // Toroidal Gaussian lookup by (dx, dy).
  const gauss = new Float64Array(n);
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      const wx = Math.min(dx, size - dx);
      const wy = Math.min(dy, size - dy);
      gauss[dy * size + dx] = Math.exp(
        -(wx * wx + wy * wy) / (2 * sigma * sigma),
      );
    }
  }

  const bits = new Uint8Array(n);
  const energy = new Float64Array(n);
  const toggle = (
    bitsArr: Uint8Array,
    energyArr: Float64Array,
    p: number,
    on: boolean,
  ) => {
    bitsArr[p] = on ? 1 : 0;
    const px = p % size;
    const py = (p / size) | 0;
    const sign = on ? 1 : -1;
    for (let y = 0; y < size; y++) {
      const dy = (y - py + size) % size;
      for (let x = 0; x < size; x++) {
        energyArr[y * size + x] +=
          sign * gauss[dy * size + ((x - px + size) % size)];
      }
    }
  };
  const tightestCluster = (bitsArr: Uint8Array, energyArr: Float64Array) => {
    let best = -1;
    for (let p = 0; p < n; p++) {
      if (bitsArr[p] && (best < 0 || energyArr[p] > energyArr[best])) best = p;
    }
    return best;
  };
  const largestVoid = (bitsArr: Uint8Array, energyArr: Float64Array) => {
    let best = -1;
    for (let p = 0; p < n; p++) {
      if (!bitsArr[p] && (best < 0 || energyArr[p] < energyArr[best])) best = p;
    }
    return best;
  };

  // Initial binary pattern: ~10% random minority pixels, then relaxed until
  // moving the tightest cluster into the largest void changes nothing.
  const random = createRandom(seed);
  const initialOnes = Math.max(1, Math.round(n / 10));
  let placed = 0;
  while (placed < initialOnes) {
    const p = Math.floor(random() * n);
    if (!bits[p]) {
      toggle(bits, energy, p, true);
      placed++;
    }
  }
  for (;;) {
    const cluster = tightestCluster(bits, energy);
    toggle(bits, energy, cluster, false);
    const voidPixel = largestVoid(bits, energy);
    toggle(bits, energy, voidPixel, true);
    if (voidPixel === cluster) break;
  }

  const ranks = new Uint16Array(n);

  // Phase 1: remove clusters from a copy of the prototype, ranking downward.
  const bits1 = bits.slice();
  const energy1 = energy.slice();
  for (let rank = placed - 1; rank >= 0; rank--) {
    const p = tightestCluster(bits1, energy1);
    toggle(bits1, energy1, p, false);
    ranks[p] = rank;
  }

  // Phases 2 and 3: fill voids, ranking upward. On a torus the "tightest
  // cluster of zeros" is exactly the largest void of ones, so one rule covers
  // both halves.
  for (let rank = placed; rank < n; rank++) {
    const p = largestVoid(bits, energy);
    toggle(bits, energy, p, true);
    ranks[p] = rank;
  }

  return { size, ranks };
}
