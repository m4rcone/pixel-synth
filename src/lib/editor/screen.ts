import { smoothChannel } from "./filters";
import type { ScreenSettings, ScreenShape } from "./settings";

/** What a screen draws: dots of a shape, or parallel lines. */
export type ScreenSpot = ScreenShape | "line";

/**
 * Spot functions over one quarter of a cell, folded: `a` runs along the
 * screen lines and `b` across them, from the cell center (0) to its edge (1).
 * The dot grows through increasing values.
 *
 * Round is the Euclidean dot of print: a circle up to 50%, a checkerboard at
 * 50%, then round holes. It is symmetric, so dark dots in the highlights and
 * light dots in the shadows are both round.
 */
const SPOTS: Record<ScreenSpot, (a: number, b: number) => number> = {
  round: (a, b) =>
    a + b <= 1 ? a * a + b * b : 2 - ((1 - a) ** 2 + (1 - b) ** 2),
  square: (a, b) => Math.max(a, b),
  diamond: (a, b) => a + b,
  line: (_a, b) => b,
};

/**
 * Tiny tie-breaker for dots, far below the step between two table cells: a
 * square's ring or a circle's mirrored points would otherwise all switch at
 * once. Lines keep their ties so their edges stay straight.
 */
const TIE_BREAK = 1e-7;

/** Resolution of the folded quarter cell the spot function is tabulated on. */
const TABLE = 128;

/**
 * Dense rank of every cell of the folded quarter cell by spot value (equal
 * values share a rank), and the number of distinct ranks.
 */
function spotRanks(spot: ScreenSpot) {
  const fn = SPOTS[spot];
  const tieBreak = spot === "line" ? 0 : TIE_BREAK;
  const count = TABLE * TABLE;
  const values = new Float64Array(count);
  for (let j = 0; j < TABLE; j++) {
    for (let i = 0; i < TABLE; i++) {
      const a = (i + 0.5) / TABLE;
      const b = (j + 0.5) / TABLE;
      values[j * TABLE + i] = fn(a, b) + tieBreak * (2 * a + b);
    }
  }
  const order = Array.from({ length: count }, (_, k) => k).sort(
    (x, y) => values[x] - values[y],
  );
  const ranks = new Int32Array(count);
  let rank = 0;
  order.forEach((cell, k) => {
    if (k > 0 && values[cell] !== values[order[k - 1]]) rank++;
    ranks[cell] = rank;
  });
  return { ranks, levels: rank + 1 };
}

const spotCache = new Map<ScreenSpot, ReturnType<typeof spotRanks>>();
const ranksFor = (spot: ScreenSpot) => {
  let ranks = spotCache.get(spot);
  if (!ranks) spotCache.set(spot, (ranks = spotRanks(spot)));
  return ranks;
};

/**
 * Order in which the mirrored halves (lines) or quarters (dots) of a cell
 * take a level: pixels mirrored across the cell center share a spot value,
 * and splitting them lets a dot grow one pixel at a time.
 */
const LINE_ORDER = [0, 1];
const DOT_ORDER = [0, 2, 3, 1];

/** Cells sampled across to measure how often each threshold occurs. */
const SAMPLE_CELLS = 16;

const MIN_THRESHOLD = 1 / 1024;

/** Screens kept ready: CMYK draws four at once, one per ink angle. */
const CACHE_SIZE = 8;
const cache = new Map<string, (x: number, y: number) => number>();

/**
 * Per-pixel threshold (0–1] of a halftone screen: a grid of cells `size`
 * pixels apart, turned `angle` degrees counterclockwise, each holding one dot
 * (or one line) that grows with the tone.
 *
 * Dots are ink by default: the cell center has the highest threshold, so it
 * turns dark first. With `light`, the center has the lowest one and lit
 * pixels form the dots instead (light dots on a dark background).
 *
 * Thresholds are ranks, measured on the pixel grid: the share of pixels
 * whose position in their cell comes earlier. So tone stays exact even when
 * few pixels make a cell, or the grid lines up with it (0°, 45°): a gray of
 * 25% inks 25% of the pixels, whatever the dot shape.
 */
export function screenThreshold(
  { size, angle }: Pick<ScreenSettings, "size" | "angle">,
  spot: ScreenSpot,
  light: boolean,
): (x: number, y: number) => number {
  const key = `${size}|${angle}|${spot}|${light}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { ranks, levels } = ranksFor(spot);
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians) / size;
  const sin = Math.sin(radians) / size;
  const lines = spot === "line";
  const order = lines ? LINE_ORDER : DOT_ORDER;
  const groups = order.length;
  const last = TABLE - 1;

  // Bucket of a pixel: the rank of its spot value, then its mirrored group.
  const bucket = (x: number, y: number) => {
    const px = x + 0.5;
    const py = y + 0.5;
    // Along the lines (u) and across them (v); y points down.
    const u = px * cos - py * sin;
    const v = px * sin + py * cos;
    const fu = u - Math.floor(u) - 0.5;
    const fv = v - Math.floor(v) - 0.5;
    const i = Math.min(last, (Math.abs(fu) * 2 * TABLE) | 0);
    const j = Math.min(last, (Math.abs(fv) * 2 * TABLE) | 0);
    const group = lines
      ? order[fv < 0 ? 0 : 1]
      : order[(fv < 0 ? 0 : 2) + (fu < 0 ? 0 : 1)];
    return ranks[j * TABLE + i] * groups + group;
  };

  // How often each bucket occurs on the pixel grid, over a patch of cells.
  const counts = new Float64Array(levels * groups);
  const patch = Math.ceil(size * SAMPLE_CELLS);
  for (let y = 0; y < patch; y++) {
    for (let x = 0; x < patch; x++) counts[bucket(x, y)]++;
  }
  const total = patch * patch;
  const thresholds = new Float32Array(counts.length);
  let before = 0;
  for (let k = 0; k < counts.length; k++) {
    // Mid-rank: pixels in one bucket switch together at its middle.
    const t = (before + counts[k] / 2) / total;
    before += counts[k];
    // Kept inside (0, 1] so pure black and pure white stay solid.
    thresholds[k] = Math.min(1, Math.max(MIN_THRESHOLD, light ? t : 1 - t));
  }

  const threshold = (x: number, y: number) => thresholds[bucket(x, y)];
  // Maps iterate in insertion order: the first key is the oldest.
  if (cache.size === CACHE_SIZE) cache.delete(cache.keys().next().value!);
  cache.set(key, threshold);
  return threshold;
}

/** Luminance (0–255) of the image a screen is laid over. */
export type ScreenImage = {
  gray: Float32Array;
  width: number;
  height: number;
};

/**
 * {@link screenThreshold}, with Line Screen's lines bent: pushed across their
 * direction by the brightness (`displace`) and by a sine wave along them
 * (`wave`, `wavelength`), all in line spacings. Dots and straight lines get
 * the plain screen.
 *
 * The brightness that pushes the lines is smoothed over about half a line
 * spacing, so lines bend in curves while their thickness still follows the
 * sharp image. Bent lines cross pixels at every phase, so the threshold is
 * the continuous distance to the line center (rank = distance for a line).
 */
export function warpedScreenThreshold(
  screen: ScreenSettings,
  spot: ScreenSpot,
  light: boolean,
  image: ScreenImage,
): (x: number, y: number) => number {
  const { size, angle, displace, wave, wavelength } = screen;
  if (spot !== "line" || (displace <= 0 && wave <= 0)) {
    return screenThreshold(screen, spot, light);
  }

  const { width, height } = image;
  const push = Float32Array.from(image.gray);
  smoothChannel(push, width, height, Math.round(size / 2));
  const lift = displace / 255;
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians) / size;
  const sin = Math.sin(radians) / size;
  const turn = (2 * Math.PI) / wavelength;

  return (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    const u = px * cos - py * sin;
    // Adding to v moves the pattern back: bright areas lift the lines.
    const v =
      px * sin +
      py * cos +
      push[y * width + x] * lift +
      wave * Math.sin(u * turn);
    const t = Math.abs(v - Math.floor(v) - 0.5) * 2;
    return Math.min(1, Math.max(MIN_THRESHOLD, light ? t : 1 - t));
  };
}
