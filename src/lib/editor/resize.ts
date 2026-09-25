import { createPixels, type Pixels } from "./pixels";

/**
 * Downscale by area averaging (box filter): every output pixel is the
 * coverage-weighted mean of the source pixels it spans. Avoids the aliasing
 * a plain nearest/bilinear downscale produces before dithering.
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
          r += src.data[i] * w;
          g += src.data[i + 1] * w;
          b += src.data[i + 2] * w;
          a += src.data[i + 3] * w;
          total += w;
        }
      }

      const o = (y * width + x) * 4;
      out.data[o] = r / total;
      out.data[o + 1] = g / total;
      out.data[o + 2] = b / total;
      out.data[o + 3] = a / total;
    }
  }
  return out;
}

/** Nearest-neighbor resize: keeps dithered pixels crisp when upscaling. */
export function resizeNearest(
  src: Pixels,
  width: number,
  height: number,
): Pixels {
  const out = createPixels(width, height);
  const src32 = new Uint32Array(
    src.data.buffer,
    src.data.byteOffset,
    src.width * src.height,
  );
  const out32 = new Uint32Array(out.data.buffer);

  for (let y = 0; y < height; y++) {
    const row =
      Math.min(src.height - 1, Math.floor((y * src.height) / height)) *
      src.width;
    for (let x = 0; x < width; x++) {
      out32[y * width + x] =
        src32[
          row + Math.min(src.width - 1, Math.floor((x * src.width) / width))
        ];
    }
  }
  return out;
}
