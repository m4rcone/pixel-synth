import { hexToRgb } from "./pixels";
import type { EditorSettings } from "./settings";

/**
 * Writes the 1-bit dither output into RGBA, coloring the "on" pixels by the
 * source luminance band they came from (highlights / midtones / shadows).
 * "Off" pixels stay black. With `preserveLuminance`, each color is scaled by
 * the pixel's original brightness. Alpha is copied from `source`.
 */
export function toneMap(
  bits: Uint8Array,
  gray: Float32Array,
  source: Uint8ClampedArray,
  out: Uint8ClampedArray,
  { tones, colorCount, preserveLuminance }: EditorSettings,
) {
  const highlights = hexToRgb(tones.highlights.color);
  const midtones = hexToRgb(tones.midtones.color);
  const shadows = hexToRgb(tones.shadows.color);
  const midtoneMax = tones.midtones.range;
  const shadowMax = tones.shadows.range;

  for (let p = 0, i = 0; p < bits.length; p++, i += 4) {
    out[i + 3] = source[i + 3];
    if (bits[p] === 0) {
      out[i] = out[i + 1] = out[i + 2] = 0;
      continue;
    }

    const lum = gray[p];
    const color =
      colorCount >= 3 && lum <= shadowMax
        ? shadows
        : colorCount >= 2 && lum <= midtoneMax
          ? midtones
          : highlights;
    const k = preserveLuminance ? Math.min(255, Math.max(0, lum)) / 255 : 1;

    out[i] = color[0] * k;
    out[i + 1] = color[1] * k;
    out[i + 2] = color[2] * k;
  }
}
