/**
 * An RGBA pixel buffer. Structurally compatible with `ImageData`, but usable
 * anywhere (workers, tests) without a DOM.
 */
export type Pixels = {
  data: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
};

export function createPixels(width: number, height: number): Pixels {
  return { data: new Uint8ClampedArray(width * height * 4), width, height };
}

export function clonePixels({ data, width, height }: Pixels): Pixels {
  return { data: new Uint8ClampedArray(data), width, height };
}

export type Rgb = [number, number, number];

/** A 6-digit hex color, as settings store them (#rrggbb). */
export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Rec. 601 luma of one color, 0–255. */
export const luma = ([r, g, b]: Rgb) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Rec. 601 luma, 0–255, one value per pixel. */
export function luminance({ data, width, height }: Pixels): Float32Array {
  const out = new Float32Array(width * height);
  for (let p = 0, i = 0; p < out.length; p++, i += 4) {
    out[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return out;
}

/**
 * 1 for every fully transparent pixel, or null when there are none (the
 * common case, so opaque images pay nothing). Error diffusion skips these
 * pixels: their stored color (black) would otherwise bleed into the edges.
 */
export function transparentMask({ data }: Pixels): Uint8Array | null {
  let mask: Uint8Array | null = null;
  for (let p = 0, i = 3; i < data.length; p++, i += 4) {
    if (data[i] === 0) (mask ??= new Uint8Array(data.length / 4))[p] = 1;
  }
  return mask;
}

/** Small deterministic PRNG (mulberry32) so renders are reproducible. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex: string): Rgb {
  let value = hex.replace(/^#/, "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(value, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
