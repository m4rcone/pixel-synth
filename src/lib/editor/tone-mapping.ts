import { blueNoiseMatrix } from "./dither";
import { hexToRgb } from "./pixels";
import { dotsAreInk, type EditorSettings } from "./settings";

/**
 * Width, in luminance levels, of the zone around each band boundary where
 * the two band colors mix (±half on each side), so bands meet without a
 * hard contour line.
 */
export const BAND_BLEND = 32;

/** Offset into the blue-noise mask, away from what the Blue Noise dither uses. */
const BLEND_OFFSET = 32;

/**
 * Writes the 1-bit dither output into RGBA. Dots mark the light areas (lit
 * pixels), or the dark ones when they are ink (see {@link dotsAreInk}); the
 * rest takes the background color, or turns transparent without one. Each
 * dot is colored by the source luminance band it came from (highlights /
 * midtones / shadows), with the bands blended near their boundaries. Alpha
 * is copied from `source`.
 */
export function toneMap(
  bits: Uint8Array,
  gray: Float32Array,
  source: Uint8ClampedArray,
  out: Uint8ClampedArray,
  width: number,
  settings: EditorSettings,
) {
  const { tones, colorCount, background } = settings;
  const [backR, backG, backB] = background ? hexToRgb(background) : [0, 0, 0];
  const ink = dotsAreInk(settings);
  const dot = ink ? 0 : 255;
  const highlights = hexToRgb(tones.highlights.color);
  const midtones = hexToRgb(tones.midtones.color);
  const shadows = hexToRgb(tones.shadows.color);
  const midtoneMax = tones.midtones.range;
  // Never past the midtones band, whatever the settings say (a shared link
  // can carry crossed ranges).
  const shadowMax = Math.min(tones.shadows.range, midtoneMax);
  const { size, ranks } = blueNoiseMatrix();
  const levels = size * size;

  for (let p = 0, i = 0; p < bits.length; p++, i += 4) {
    out[i + 3] = source[i + 3];
    if (bits[p] !== dot) {
      out[i] = backR;
      out[i + 1] = backG;
      out[i + 2] = backB;
      if (!background) out[i + 3] = 0;
      continue;
    }

    let color = highlights;
    if (colorCount > 1) {
      // Blue-noise jitter spreads each boundary over BAND_BLEND levels.
      const x = ((p % width) + BLEND_OFFSET) % size;
      const y = (((p / width) | 0) + BLEND_OFFSET) % size;
      const jitter = ((ranks[y * size + x] + 0.5) / levels - 0.5) * BAND_BLEND;
      const lum = gray[p] + jitter;
      color =
        colorCount >= 3 && lum <= shadowMax
          ? shadows
          : lum <= midtoneMax
            ? midtones
            : highlights;
    }
    out[i] = color[0];
    out[i + 1] = color[1];
    out[i + 2] = color[2];
  }
}
