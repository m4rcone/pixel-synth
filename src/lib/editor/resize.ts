import { createPixels, type Pixels } from "./pixels";

/** Longest edge, in pixels, an uploaded image is scaled down to. */
export const MAX_IMAGE_SIZE = 2000;

/**
 * Downscale by area averaging (box filter): every output pixel is the
 * coverage-weighted mean of the source pixels it spans. Avoids the aliasing
 * a plain nearest/bilinear downscale produces before dithering. Colors are
 * weighted by alpha too, so transparent pixels (stored as black) don't darken
 * the edges of a cutout.
 */
export function resizeArea(src: Pixels, width: number, height: number): Pixels {
  const out = createPixels(width, height);
  const sx = src.width / width;
  const sy = src.height / height;

  for (let y = 0; y < height; y++) {
    const y0 = y * sy;
    const y1 = y0 + sy;
    for (let x = 0; x < width; x++) {
      const x0 = x * sx;
      const x1 = x0 + sx;
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        total = 0;

      for (
        let yy = Math.floor(y0);
        yy < Math.min(Math.ceil(y1), src.height);
        yy++
      ) {
        const wy = Math.min(yy + 1, y1) - Math.max(yy, y0);
        for (
          let xx = Math.floor(x0);
          xx < Math.min(Math.ceil(x1), src.width);
          xx++
        ) {
          const w = wy * (Math.min(xx + 1, x1) - Math.max(xx, x0));
          const i = (yy * src.width + xx) * 4;
          const aw = src.data[i + 3] * w;
          r += src.data[i] * aw;
          g += src.data[i + 1] * aw;
          b += src.data[i + 2] * aw;
          a += aw;
          total += w;
        }
      }

      const o = (y * width + x) * 4;
      if (a > 0) {
        out.data[o] = r / a;
        out.data[o + 1] = g / a;
        out.data[o + 2] = b / a;
      }
      out.data[o + 3] = a / total;
    }
  }
  return out;
}
