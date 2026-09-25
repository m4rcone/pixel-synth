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

/** Rec. 601 luma, 0–255, one value per pixel. */
export function luminance({ data, width, height }: Pixels): Float32Array {
  const out = new Float32Array(width * height);
  for (let p = 0, i = 0; p < out.length; p++, i += 4) {
    out[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return out;
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

export function hexToRgb(hex: string): [number, number, number] {
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
