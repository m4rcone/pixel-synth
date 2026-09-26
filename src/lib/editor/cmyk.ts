import { dither } from "./dither";
import { createPixels, hexToRgb, type Pixels } from "./pixels";
import type { EditorSettings } from "./settings";

/**
 * The four process inks, in printing order. Colors are the usual sRGB
 * stand-ins for process inks on coated paper. `offset` is each screen's
 * angle from the black screen: with black at 45°, cyan 15°, magenta 75° and
 * yellow 0°, the classic angles that keep the four screens from beating
 * into moiré (they form small rosettes instead).
 */
export const INKS = [
  { id: "cyan", name: "Cyan", color: "#00aeef", offset: -30 },
  { id: "magenta", name: "Magenta", color: "#ec008c", offset: 30 },
  { id: "yellow", name: "Yellow", color: "#fff200", offset: -45 },
  { id: "black", name: "Black", color: "#231f20", offset: 0 },
] as const;

/** Screen angle (0–180°) of an ink, given the screen angle set for black. */
export function inkAngle(screenAngle: number, offset: number) {
  return (((screenAngle + offset) % 180) + 180) % 180;
}

/**
 * Ink coverage of every pixel, one plane per ink, stored as the luminance
 * the dither expects: 255 = no ink, 0 = solid ink.
 *
 * Naive separation (C = 1 − R…), then gray component replacement: black
 * takes `black` × the gray the three colors share, and they give it up.
 * Dividing by (1 − K) keeps the overprint exact: (1 − C′)(1 − K) = 1 − C.
 */
export function separate(src: Pixels, black: number): Float32Array[] {
  const count = src.width * src.height;
  const planes = INKS.map(() => new Float32Array(count));
  const [cyan, magenta, yellow, key] = planes;
  const { data } = src;
  for (let p = 0, i = 0; p < count; p++, i += 4) {
    const c = 1 - data[i] / 255;
    const m = 1 - data[i + 1] / 255;
    const y = 1 - data[i + 2] / 255;
    const k = black * Math.min(c, m, y);
    const rest = k < 1 ? 1 / (1 - k) : 0;
    cyan[p] = 255 * (1 - (c - k) * rest);
    magenta[p] = 255 * (1 - (m - k) * rest);
    yellow[p] = 255 * (1 - (y - k) * rest);
    key[p] = 255 * (1 - k);
  }
  return planes;
}

/**
 * Colors of the 16 ink combinations on white paper, indexed by a bit mask
 * (bit n = INKS[n] printed). Inks are transparent and multiply.
 */
export const OVERPRINTS = (() => {
  const inks = INKS.map(({ color }) => hexToRgb(color));
  return Array.from({ length: 1 << inks.length }, (_, mask) =>
    [0, 1, 2].map((channel) =>
      Math.round(
        inks.reduce(
          (value, ink, n) =>
            mask & (1 << n) ? (value * ink[channel]) / 255 : value,
          255,
        ),
      ),
    ),
  );
})();

/**
 * Dithers each ink separately with the chosen algorithm: per pixel, a bit
 * mask of the inks it carries (bit n = INKS[n]). Screens turn to each ink's
 * angle; ordered and random dithers shift their pattern per ink.
 */
export function inkMasks(src: Pixels, settings: EditorSettings): Uint8Array {
  const { width, height } = src;
  const { algorithm, diffusion, screen } = settings;
  const masks = new Uint8Array(width * height);

  separate(src, settings.color.black).forEach((plane, n) => {
    const bits = dither(
      plane,
      width,
      height,
      algorithm,
      diffusion,
      {
        ...screen,
        angle: inkAngle(screen.angle, INKS[n].offset),
        light: false,
      },
      n,
    );
    const bit = 1 << n;
    for (let p = 0; p < bits.length; p++) {
      if (bits[p] === 0) masks[p] |= bit;
    }
  });
  return masks;
}

/** The inks of {@link inkMasks} overprinted on white paper. Alpha is copied. */
export function ditherCmyk(src: Pixels, settings: EditorSettings): Pixels {
  const masks = inkMasks(src, settings);
  const out = createPixels(src.width, src.height);
  for (let p = 0, i = 0; p < masks.length; p++, i += 4) {
    const [r, g, b] = OVERPRINTS[masks[p]];
    out.data[i] = r;
    out.data[i + 1] = g;
    out.data[i + 2] = b;
    out.data[i + 3] = src.data[i + 3];
  }
  return out;
}
