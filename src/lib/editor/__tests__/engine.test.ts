import { describe, expect, it } from "vitest";
import { ALGORITHMS } from "@/lib/algorithms";
import { dither } from "../dither";
import { applyFilters } from "../filters";
import { bayerMatrix, ERROR_KERNELS, voidAndCluster } from "../matrices";
import { renderPixels } from "../pipeline";
import { createPixels, type Pixels } from "../pixels";
import { resizeArea, resizeNearest } from "../resize";
import { DEFAULT_SETTINGS } from "../settings";

function gradient(width: number, height: number): Pixels {
  const pixels = createPixels(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const v = (x / (width - 1)) * 255;
      pixels.data.set([v, v, v, 255], i);
    }
  }
  return pixels;
}

function flat(value: number, size: number) {
  return new Float32Array(size * size).fill(value);
}

const mean = (bits: Uint8Array) =>
  bits.reduce((sum, v) => sum + v, 0) / bits.length;

describe("threshold matrices", () => {
  it.each([2, 4, 8])("Bayer %i×%i is a permutation of 0…n²−1", (size) => {
    const { ranks } = bayerMatrix(size);
    expect([...ranks].sort((a, b) => a - b)).toEqual(
      Array.from({ length: size * size }, (_, i) => i),
    );
  });

  it("Bayer 4×4 matches the canonical matrix", () => {
    expect([...bayerMatrix(4).ranks]).toEqual([
      0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
    ]);
  });

  it("void-and-cluster produces a deterministic permutation", () => {
    const a = voidAndCluster(16);
    const b = voidAndCluster(16);
    expect([...a.ranks]).toEqual([...b.ranks]);
    expect(new Set(a.ranks).size).toBe(256);
    expect(Math.max(...a.ranks)).toBe(255);
  });

  it("void-and-cluster spreads the first levels evenly (blue noise)", () => {
    // The 16 lowest ranks of a 16×16 array should land one per 4×4 block
    // far more often than a random placement would.
    const { ranks, size } = voidAndCluster(16);
    const blocks = new Set<number>();
    ranks.forEach((rank, p) => {
      if (rank < 16) {
        const bx = Math.floor((p % size) / 4);
        const by = Math.floor(Math.floor(p / size) / 4);
        blocks.add(by * 4 + bx);
      }
    });
    expect(blocks.size).toBeGreaterThanOrEqual(13);
  });
});

describe("error kernels", () => {
  it.each(Object.entries(ERROR_KERNELS))(
    "%s weights sum correctly",
    (name, kernel) => {
      const total = kernel.reduce((sum, [, , w]) => sum + w, 0);
      expect(total).toBeCloseTo(name === "atkinson" ? 6 / 8 : 1, 10);
    },
  );
});

describe("dither", () => {
  it.each(ALGORITHMS.map((a) => a.slug))(
    "%s outputs only 0/255 and preserves average tone",
    (slug) => {
      const size = 64;
      const bits = dither(flat(64, size), size, size, slug);
      expect(bits.every((v) => v === 0 || v === 255)).toBe(true);
      // 25% gray → roughly 25% white pixels. Atkinson discards 1/4 of the
      // error by design, which darkens shadows a little.
      expect(mean(bits) / 255).toBeGreaterThan(
        slug === "atkinson" ? 0.15 : 0.18,
      );
      expect(mean(bits) / 255).toBeLessThan(0.32);
    },
  );

  it("error diffusion does not lose error to clipping", () => {
    // A near-white field must stay near-white. With 8-bit clipped error
    // buffers, negative error is lost and bright fields drift.
    const size = 64;
    const bits = dither(flat(250, size), size, size, "floyd-steinberg");
    expect(mean(bits) / 255).toBeCloseTo(250 / 255, 1);
  });

  it("is deterministic, including random dither", () => {
    const g = flat(100, 32);
    expect(dither(g, 32, 32, "random-dither")).toEqual(
      dither(g, 32, 32, "random-dither"),
    );
  });
});

describe("resize", () => {
  it("area downscale averages blocks", () => {
    const src = createPixels(2, 2);
    src.data.set([
      0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255,
    ]);
    const out = resizeArea(src, 1, 1);
    expect(out.data[0]).toBe(128);
  });

  it("nearest upscale keeps hard edges", () => {
    const src = createPixels(2, 1);
    src.data.set([0, 0, 0, 255, 255, 255, 255, 255]);
    const out = resizeNearest(src, 4, 1);
    expect([...out.data].filter((_, i) => i % 4 === 0)).toEqual([
      0, 0, 255, 255,
    ]);
  });
});

describe("filters", () => {
  it("brightness scales, contrast pivots around mid-gray", () => {
    const px = createPixels(1, 1);
    px.data.set([100, 100, 100, 255]);
    applyFilters(px, { brightness: 1.5, contrast: 0, noise: 0, blur: 0 });
    expect(px.data[0]).toBe(150);

    const mid = createPixels(1, 1);
    mid.data.set([127.5, 200, 55, 255]);
    applyFilters(mid, { brightness: 1, contrast: 1, noise: 0, blur: 0 });
    expect(mid.data[1]).toBe(255);
    expect(mid.data[2]).toBe(0);
  });

  it("blur keeps a flat field flat and softens an edge", () => {
    const px = gradient(32, 4);
    const edge = createPixels(8, 1);
    edge.data.set([
      0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255,
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    ]);
    applyFilters(edge, { brightness: 1, contrast: 0, noise: 0, blur: 2 });
    expect(edge.data[3 * 4]).toBeGreaterThan(0);
    expect(edge.data[4 * 4]).toBeLessThan(255);
    applyFilters(px, { brightness: 1, contrast: 0, noise: 0, blur: 0 });
    expect(px.data[0]).toBe(0);
  });
});

describe("renderPixels", () => {
  it("returns the source size, even with a processing scale", () => {
    const src = gradient(40, 20);
    const out = renderPixels(
      src,
      { ...DEFAULT_SETTINGS, scale: 0.25 },
      { dither: true },
    );
    expect([out.width, out.height]).toEqual([40, 20]);
  });

  it("maps tones by luminance band", () => {
    const src = gradient(256, 1);
    const out = renderPixels(
      src,
      { ...DEFAULT_SETTINGS, algorithm: "bayer-2-2", colorCount: 3 },
      { dither: true },
    );
    const colors = new Set<string>();
    for (let i = 0; i < out.data.length; i += 4) {
      colors.add(`${out.data[i]},${out.data[i + 1]},${out.data[i + 2]}`);
    }
    // black + the three default tone colors
    expect(colors).toEqual(
      new Set(["0,0,0", "255,255,255", "229,57,53", "30,136,229"]),
    );
  });

  it("does not mutate the source", () => {
    const src = gradient(16, 16);
    const copy = new Uint8ClampedArray(src.data);
    renderPixels(
      src,
      {
        ...DEFAULT_SETTINGS,
        filters: { ...DEFAULT_SETTINGS.filters, contrast: 0.5 },
      },
      { dither: true },
    );
    expect(src.data).toEqual(copy);
  });
});
