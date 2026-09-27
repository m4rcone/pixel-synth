import { describe, expect, it } from "vitest";
import { ALGORITHMS } from "@/lib/algorithms";
import { PALETTE_PRESETS } from "@/lib/palettes";
import { dither, getMethod, type ScreenOptions } from "../dither";
import { applyFilters } from "../filters";
import { bayerMatrix, ERROR_KERNELS, voidAndCluster } from "../matrices";
import { ditherToPalette, extractPalette } from "../palette-dither";
import { renderPixels } from "../pipeline";
import { createPixels, type Pixels } from "../pixels";
import { resizeArea } from "../resize";
import { BAND_BLEND } from "../tone-mapping";
import {
  DEFAULT_FILTERS,
  DEFAULT_SETTINGS,
  dotsAreInk,
  orderedTones,
  SCREEN_SHAPES,
  type EditorSettings,
} from "../settings";

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
      const total =
        kernel.taps.reduce((sum, [, , w]) => sum + w, 0) / kernel.divisor;
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

  it("area downscale ignores the color of transparent pixels", () => {
    const src = createPixels(2, 1);
    src.data.set([255, 255, 255, 255, 0, 0, 0, 0]);
    const out = resizeArea(src, 1, 1);
    expect([...out.data]).toEqual([255, 255, 255, 128]);
  });

  it("area downscale of fully transparent pixels stays transparent", () => {
    const src = createPixels(2, 1);
    const out = resizeArea(src, 1, 1);
    expect([...out.data]).toEqual([0, 0, 0, 0]);
  });
});

describe("filters", () => {
  it("brightness scales, contrast pivots around mid-gray", () => {
    const px = createPixels(1, 1);
    px.data.set([100, 100, 100, 255]);
    applyFilters(px, {
      ...DEFAULT_FILTERS,
      brightness: 1.5,
      contrast: 0,
      blur: 0,
    });
    expect(px.data[0]).toBe(150);

    const mid = createPixels(1, 1);
    mid.data.set([127.5, 200, 55, 255]);
    applyFilters(mid, {
      ...DEFAULT_FILTERS,
      brightness: 1,
      contrast: 1,
      blur: 0,
    });
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
    applyFilters(edge, {
      ...DEFAULT_FILTERS,
      brightness: 1,
      contrast: 0,
      blur: 2,
    });
    expect(edge.data[3 * 4]).toBeGreaterThan(0);
    expect(edge.data[4 * 4]).toBeLessThan(255);
    applyFilters(px, {
      ...DEFAULT_FILTERS,
      brightness: 1,
      contrast: 0,
      blur: 0,
    });
    expect(px.data[0]).toBe(0);
  });
});

describe("blur strength", () => {
  // A hard edge; how far the blur spreads it into the white side.
  const spread = (blur: number) => {
    const edge = createPixels(32, 1);
    for (let x = 0; x < 32; x++) {
      const v = x < 16 ? 0 : 255;
      edge.data.set([v, v, v, 255], x * 4);
    }
    applyFilters(edge, { ...DEFAULT_FILTERS, blur });
    return 255 - edge.data[16 * 4];
  };

  it("acts from low values (not only past ~0.9) and grows with it", () => {
    // Below ~0.4 a Gaussian that narrow barely touches the neighbors.
    const values = [0.5, 0.8, 1, 2, 3.5, 5].map(spread);
    expect(values[0]).toBeGreaterThan(0);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe("levels", () => {
  const gray = (...values: number[]) => {
    const px = createPixels(values.length, 1);
    values.forEach((v, i) => px.data.set([v, v, v, 255], i * 4));
    return px;
  };
  const reds = (px: Pixels) => [...px.data].filter((_, i) => i % 4 === 0);

  it("maps the black and white points to 0 and 255", () => {
    const px = gray(10, 40, 140, 240, 250);
    applyFilters(px, { ...DEFAULT_FILTERS, blackPoint: 40, whitePoint: 240 });
    expect(reds(px)).toEqual([0, 0, 128, 255, 255]);
  });

  it("gamma above 1 lightens the midtones, below 1 darkens them", () => {
    const light = gray(0, 128, 255);
    applyFilters(light, { ...DEFAULT_FILTERS, gamma: 2 });
    expect(reds(light)).toEqual([0, Math.round(255 * (128 / 255) ** 0.5), 255]);
    const dark = gray(128);
    applyFilters(dark, { ...DEFAULT_FILTERS, gamma: 0.5 });
    expect(dark.data[0]).toBeLessThan(128);
  });

  it("keeps a step between crossed points", () => {
    const px = gray(99, 100, 101);
    applyFilters(px, { ...DEFAULT_FILTERS, blackPoint: 100, whitePoint: 20 });
    expect(reds(px)).toEqual([0, 0, 255]);
  });
});

describe("sharpen", () => {
  it("leaves a flat field alone and steepens an edge", () => {
    const flatField = createPixels(8, 8);
    flatField.data.fill(90);
    applyFilters(flatField, { ...DEFAULT_FILTERS, sharpen: 2 });
    expect(new Set(flatField.data.filter((_, i) => i % 4 !== 3))).toEqual(
      new Set([90]),
    );

    const edge = createPixels(8, 1);
    for (let x = 0; x < 8; x++) {
      const v = x < 4 ? 60 : 180;
      edge.data.set([v, v, v, 255], x * 4);
    }
    applyFilters(edge, { ...DEFAULT_FILTERS, sharpen: 1 });
    expect(edge.data[3 * 4]).toBeLessThan(60);
    expect(edge.data[4 * 4]).toBeGreaterThan(180);
    expect(edge.data[4 * 4 + 3]).toBe(255);
  });
});

describe("dots as ink", () => {
  // Left third dark, middle gray, right third light.
  const thirds = () => {
    const px = createPixels(90, 30);
    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 90; x++) {
        const v = x < 30 ? 30 : x < 60 ? 128 : 225;
        px.data.set([v, v, v, 255], (y * 90 + x) * 4);
      }
    }
    return px;
  };
  const withDots = (color: string, background: string | null) => ({
    ...DEFAULT_SETTINGS,
    algorithm: "bayer-4-4" as const,
    background,
    tones: {
      ...DEFAULT_SETTINGS.tones,
      highlights: { color, range: 255 },
    },
  });
  // Share of each third that reads as dark (red channel below 128).
  const darkness = (settings: EditorSettings) => {
    const { pixels } = renderPixels(thirds(), settings, { dither: true });
    return [0, 30, 60].map((x0) => {
      let dark = 0;
      for (let y = 0; y < 30; y++) {
        for (let x = x0; x < x0 + 30; x++) {
          if (pixels.data[(y * 90 + x) * 4] < 128) dark++;
        }
      }
      return dark / 900;
    });
  };

  it("keeps a dark image dark on a light background", () => {
    const [dark, gray, light] = darkness(withDots("#000000", "#ffffff"));
    expect(dark).toBeGreaterThan(0.8);
    expect(gray).toBeCloseTo(0.5, 1);
    expect(light).toBeLessThan(0.2);
    // Same reading as light dots on black.
    expect(darkness(withDots("#ffffff", "#000000"))).toEqual(
      darkness(withDots("#000000", "#ffffff")),
    );
  });

  it("follows the dots against the background, or alone when transparent", () => {
    const at = (color: string, background: string | null) =>
      dotsAreInk(withDots(color, background));
    expect(at("#ffffff", "#000000")).toBe(false);
    expect(at("#000000", "#ffffff")).toBe(true);
    expect(at("#1e88e5", "#f4efe6")).toBe(true);
    expect(at("#ffd54f", "#263238")).toBe(false);
    expect(at("#000000", null)).toBe(true);
    expect(at("#ffffff", null)).toBe(false);
    expect(dotsAreInk(DEFAULT_SETTINGS)).toBe(false);
  });
});

describe("1-bit background", () => {
  const render = (background: string | null) =>
    renderPixels(
      gradient(16, 2),
      { ...DEFAULT_SETTINGS, algorithm: "bayer-4-4", background },
      { dither: true },
    ).pixels.data;
  const offPixels = (data: Uint8ClampedArray) =>
    [...Array(data.length / 4).keys()]
      .map((p) => [...data.subarray(p * 4, p * 4 + 4)])
      .filter(([r, g, b]) => !(r === 255 && g === 255 && b === 255));

  it("paints off pixels with the background color", () => {
    const off = offPixels(render("#1e88e5"));
    expect(off.length).toBeGreaterThan(0);
    for (const pixel of off) expect(pixel).toEqual([30, 136, 229, 255]);
  });

  it("leaves them transparent without one, and black by default", () => {
    const transparent = render(null);
    const black = render(DEFAULT_SETTINGS.background);
    for (let i = 0; i < black.length; i += 4) {
      const on = black[i] === 255;
      expect(transparent[i + 3]).toBe(on ? 255 : 0);
      if (!on) expect([...black.subarray(i, i + 4)]).toEqual([0, 0, 0, 255]);
    }
  });
});

describe("saturation", () => {
  const color = () => {
    const px = createPixels(1, 1);
    px.data.set([200, 100, 50, 255]);
    return px;
  };

  it("0 turns colors into their gray", () => {
    const px = color();
    applyFilters(px, { ...DEFAULT_FILTERS, saturation: 0 });
    const luma = Math.round(0.299 * 200 + 0.587 * 100 + 0.114 * 50);
    expect([...px.data.slice(0, 3)]).toEqual([luma, luma, luma]);
  });

  it("above 1 pushes channels away from the gray", () => {
    const px = color();
    applyFilters(px, { ...DEFAULT_FILTERS, saturation: 1.5 });
    expect(px.data[0]).toBeGreaterThan(200);
    expect(px.data[2]).toBeLessThan(50);
  });
});

describe("diffusion strength", () => {
  // A flat 25% gray: classic diffusion lights about a quarter of the pixels.
  const flat = (value: number) => new Float32Array(64 * 64).fill(value);
  const lit = (bits: Uint8Array) => bits.filter((b) => b === 255).length;

  it("the catalog's error diffusion family is what the engine diffuses", () => {
    // The editor shows the strength control from the catalog category.
    for (const algorithm of ALGORITHMS) {
      expect(
        getMethod(algorithm.slug).kind === "diffusion",
        algorithm.slug,
      ).toBe(algorithm.category === "error-diffusion");
    }
  });

  it("1 is the classic algorithm, bit for bit", () => {
    const gray = gradient(48, 8);
    const settings = { ...DEFAULT_SETTINGS, algorithm: "atkinson" as const };
    expect(renderPixels(gray, settings, { dither: true }).pixels.data).toEqual(
      renderPixels(gray, { ...settings, diffusion: 1 }, { dither: true }).pixels
        .data,
    );
  });

  it("scales the error passed on, down to a plain threshold at 0", () => {
    const full = lit(dither(flat(64), 64, 64, "floyd-steinberg", 1));
    const half = lit(dither(flat(64), 64, 64, "floyd-steinberg", 0.5));
    const none = dither(flat(64), 64, 64, "floyd-steinberg", 0);
    expect(full / (64 * 64)).toBeCloseTo(0.25, 1);
    expect(half).toBeLessThan(full);
    expect(none).toEqual(dither(flat(64), 64, 64, "none"));
  });

  it("applies to palette dithering too", () => {
    const src = gradient(48, 8);
    const colors = ["#000000", "#ffffff"];
    expect(
      ditherToPalette(src, "floyd-steinberg", colors, "color", 0).data,
    ).toEqual(ditherToPalette(src, "none", colors, "color").data);
    expect(
      ditherToPalette(src, "floyd-steinberg", colors, "brightness", 0).data,
    ).toEqual(ditherToPalette(src, "none", colors, "brightness").data);
  });
});

describe("halftone screens", () => {
  const SIZE = 96;
  const field = (value: number) => new Float32Array(SIZE * SIZE).fill(value);
  const screen = (
    algorithm: "halftone" | "line-screen",
    value: number,
    options: Partial<ScreenOptions> = {},
  ) =>
    dither(field(value), SIZE, SIZE, algorithm, 1, {
      ...DEFAULT_SETTINGS.screen,
      light: false,
      ...options,
    });
  const litShare = (bits: Uint8Array) =>
    bits.filter((b) => b === 255).length / bits.length;
  const cases = [
    ...SCREEN_SHAPES.map((shape) => ["halftone", shape] as const),
    ["line-screen", "round"] as const,
  ];

  it("the catalog's screen family is what the engine screens", () => {
    for (const algorithm of ALGORITHMS) {
      expect(getMethod(algorithm.slug).kind === "screen", algorithm.slug).toBe(
        algorithm.category === "screen",
      );
    }
  });

  it.each(cases)("%s (%s) reproduces the tone at any angle", (slug, shape) => {
    for (const angle of [0, 22.5, 45, 75, 105]) {
      for (const value of [32, 128, 200]) {
        for (const light of [false, true]) {
          const bits = screen(slug, value, { shape, angle, light });
          expect(litShare(bits), `${angle}° ${value} ${light}`).toBeCloseTo(
            value / 255,
            1,
          );
        }
      }
    }
  });

  it.each(cases)("%s (%s) keeps black and white solid", (slug, shape) => {
    for (const light of [false, true]) {
      expect(litShare(screen(slug, 0, { shape, light }))).toBe(0);
      expect(litShare(screen(slug, 255, { shape, light }))).toBe(1);
    }
  });

  it("gains a gray level with every pixel of the cell", () => {
    // Mirrored pixels don't tie: an 8 px cell has 64 thresholds, 65 levels.
    const levels = new Set<number>();
    for (let value = 0; value <= 255; value++) {
      levels.add(litShare(screen("halftone", value, { angle: 0 })));
    }
    expect(levels.size).toBe(65);
  });

  // Distance of each marked pixel to the nearest cell center, at 0°.
  const spread = (bits: Uint8Array, mark: number, size: number) => {
    let farthest = 0;
    bits.forEach((b, p) => {
      if (b !== mark) return;
      const dx = ((((p % SIZE) + 0.5) % size) - size / 2) ** 2;
      const dy = (((((p / SIZE) | 0) + 0.5) % size) - size / 2) ** 2;
      farthest = Math.max(farthest, Math.sqrt(dx + dy));
    });
    return farthest;
  };

  it("grows the dots from the cell center, as ink or as light", () => {
    const options = { angle: 0, size: 12, shape: "square" as const };
    // 10% ink: small dark squares on light.
    const ink = screen("halftone", 230, options);
    expect(spread(ink, 0, 12)).toBeLessThan(3);
    // 10% light: small lit squares on dark.
    const light = screen("halftone", 25, { ...options, light: true });
    expect(spread(light, 255, 12)).toBeLessThan(3);
    // Without the flip, those lit pixels would sit on the cell edges.
    expect(spread(screen("halftone", 25, options), 255, 12)).toBeGreaterThan(5);
  });

  it("draws lines along the angle", () => {
    const flat = screen("line-screen", 100, { angle: 0 });
    for (let y = 0; y < SIZE; y++) {
      const row = flat.subarray(y * SIZE, (y + 1) * SIZE);
      expect(row.every((b) => b === row[0])).toBe(true);
    }
    const upright = screen("line-screen", 100, { angle: 90 });
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        expect(upright[y * SIZE + x]).toBe(flat[x * SIZE + y]);
      }
    }
  });

  it("lifts the lines by the brightness", () => {
    // 40% gray, 8 px lines, displacement 1.25: 1.25 × 0.4 × 8 = 4 px up.
    const lifted = screen("line-screen", 102, { angle: 0, displace: 1.25 });
    const straight = screen("line-screen", 102, { angle: 0, displace: 1e-6 });
    for (let y = 0; y < SIZE - 4; y++) {
      expect(lifted[y * SIZE], `row ${y}`).toBe(straight[(y + 4) * SIZE]);
    }
    // Where the image is brighter, the lines sit higher.
    const gray = new Float32Array(SIZE * SIZE).map((_, p) =>
      p % SIZE < SIZE / 2 ? 40 : 200,
    );
    const bits = dither(gray, SIZE, SIZE, "line-screen", 1, {
      ...DEFAULT_SETTINGS.screen,
      angle: 0,
      displace: 1,
      light: false,
    });
    const column = (x: number) =>
      Array.from({ length: SIZE }, (_, y) => bits[y * SIZE + x]).join();
    expect(column(8)).not.toBe(column(SIZE - 8));
  });

  it("waves the lines along their length", () => {
    const bits = screen("line-screen", 100, {
      angle: 0,
      wave: 0.5,
      wavelength: 6,
    });
    const rows = Array.from({ length: SIZE }, (_, y) =>
      bits.subarray(y * SIZE, (y + 1) * SIZE),
    );
    expect(rows.some((row) => row.some((b) => b !== row[0]))).toBe(true);
  });

  it("keeps the tone when the lines bend", () => {
    for (const angle of [0, 30]) {
      for (const value of [40, 128, 210]) {
        const bits = screen("line-screen", value, {
          angle,
          displace: 2,
          wave: 0.6,
          wavelength: 5,
        });
        expect(litShare(bits), `${angle}° ${value}`).toBeCloseTo(
          value / 255,
          1,
        );
      }
    }
  });

  it("leaves dots alone: bending is for lines", () => {
    const warp = { displace: 2, wave: 1 };
    expect(screen("halftone", 90, warp)).toEqual(screen("halftone", 90));
  });

  it("gives palettes darker dots between neighboring colors", () => {
    const run = (value: number, match: "color" | "brightness") => {
      const gray = createPixels(SIZE, SIZE);
      for (let i = 0; i < gray.data.length; i += 4)
        gray.data.set([value, value, value, 255], i);
      const out = ditherToPalette(
        gray,
        "halftone",
        ["#000000", "#ffffff"],
        match,
        1,
        { ...DEFAULT_SETTINGS.screen, angle: 0, size: 12, shape: "square" },
      );
      return new Uint8Array(SIZE * SIZE).map((_, p) => out.data[p * 4]);
    };
    const ramp = run(230, "brightness");
    expect(litShare(ramp)).toBeCloseTo(230 / 255, 1);
    expect(spread(ramp, 0, 12)).toBeLessThan(3);
    // Color matching nudges less, like every threshold method.
    expect(spread(run(200, "color"), 0, 12)).toBeLessThan(3);
  });

  it("follows the dots of the tone map", () => {
    // Dark dots on paper and light dots on black are both centered dots.
    const src = createPixels(SIZE, SIZE);
    const settings = {
      ...DEFAULT_SETTINGS,
      algorithm: "halftone" as const,
      screen: {
        ...DEFAULT_SETTINGS.screen,
        size: 12,
        angle: 0,
        shape: "square" as const,
      },
    };
    const dots = (value: number, overrides: Partial<EditorSettings>) => {
      for (let i = 0; i < src.data.length; i += 4)
        src.data.set([value, value, value, 255], i);
      const { pixels } = renderPixels(
        src,
        { ...settings, ...overrides },
        { dither: true },
      );
      const bits = new Uint8Array(SIZE * SIZE).map((_, p) =>
        pixels.data[p * 4] < 128 ? 0 : 255,
      );
      return bits;
    };
    const paper = dots(230, {
      background: "#ffffff",
      tones: {
        ...DEFAULT_SETTINGS.tones,
        highlights: { color: "#000000", range: 255 },
      },
    });
    expect(spread(paper, 0, 12)).toBeLessThan(3);
    expect(spread(dots(25, {}), 255, 12)).toBeLessThan(3);
  });
});

describe("renderPixels", () => {
  it("returns the native processing resolution", () => {
    const src = gradient(40, 20);
    const { pixels } = renderPixels(
      src,
      { ...DEFAULT_SETTINGS, scale: 0.25 },
      { dither: true },
    );
    expect([pixels.width, pixels.height]).toEqual([10, 5]);
  });

  it("maps tones by luminance band", () => {
    const src = gradient(256, 1);
    const { pixels: out } = renderPixels(
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

  it("each band covers the luminance up to its bound, blended at the edge", () => {
    // A pure ramp, 1 pixel per level; Bayer lights some pixels in each band.
    const src = gradient(256, 4);
    const tones = (shadows: number, midtones: number) => ({
      ...DEFAULT_SETTINGS.tones,
      shadows: { ...DEFAULT_SETTINGS.tones.shadows, range: shadows },
      midtones: { ...DEFAULT_SETTINGS.tones.midtones, range: midtones },
    });
    const bandOf = (settings: EditorSettings) => {
      const { pixels } = renderPixels(
        src,
        { ...settings, algorithm: "bayer-2-2" },
        { dither: true },
      );
      // Highest input level each color was used for, across the ramp.
      const top = new Map<string, number>();
      for (let x = 0; x < 256; x++) {
        for (let y = 0; y < 4; y++) {
          const i = (y * 256 + x) * 4;
          const key = `${pixels.data[i]},${pixels.data[i + 1]},${pixels.data[i + 2]}`;
          if (key !== "0,0,0") top.set(key, x);
        }
      }
      return top;
    };

    const bands = bandOf({
      ...DEFAULT_SETTINGS,
      colorCount: 3,
      tones: tones(60, 150),
    });
    const blend = BAND_BLEND / 2;
    expect(bands.get("30,136,229")).toBeLessThanOrEqual(60 + blend);
    expect(bands.get("229,57,53")).toBeLessThanOrEqual(150 + blend);
    expect(bands.get("229,57,53")).toBeGreaterThan(60 + blend);
    expect(bands.get("255,255,255")).toBe(255);

    // Crossed ranges (e.g. from a shared link): shadows stop at the
    // midtones bound instead of taking over the highlights.
    const crossed = bandOf({
      ...DEFAULT_SETTINGS,
      colorCount: 3,
      tones: tones(200, 150),
    });
    expect(crossed.get("30,136,229")).toBeLessThanOrEqual(150 + blend);
    expect(crossed.get("255,255,255")).toBe(255);
  });

  it("mixes two bands only near their boundary", () => {
    // Flat columns of luminance 0–255; which dot colors each column uses.
    const src = gradient(256, 64);
    const { pixels } = renderPixels(
      src,
      {
        ...DEFAULT_SETTINGS,
        algorithm: "bayer-4-4",
        colorCount: 2,
        tones: {
          ...DEFAULT_SETTINGS.tones,
          midtones: { ...DEFAULT_SETTINGS.tones.midtones, range: 128 },
        },
      },
      { dither: true },
    );
    const colorsAt = (x: number) => {
      const found = new Set<string>();
      for (let y = 0; y < 64; y++) {
        const i = (y * 256 + x) * 4;
        const key = `${pixels.data[i]},${pixels.data[i + 1]},${pixels.data[i + 2]}`;
        if (key !== "0,0,0") found.add(key);
      }
      return found;
    };
    const mid = "229,57,53";
    const high = "255,255,255";
    const blend = BAND_BLEND / 2;
    expect(colorsAt(128 - blend - 4)).toEqual(new Set([mid]));
    expect(colorsAt(128 + blend + 4)).toEqual(new Set([high]));
    for (const x of [124, 128, 132]) {
      expect(colorsAt(x)).toEqual(new Set([mid, high]));
    }
  });

  it("orders crossed tone bands", () => {
    const at = (shadows: number, midtones: number) =>
      orderedTones({
        ...DEFAULT_SETTINGS.tones,
        shadows: { ...DEFAULT_SETTINGS.tones.shadows, range: shadows },
        midtones: { ...DEFAULT_SETTINGS.tones.midtones, range: midtones },
      });
    const ranges = (t: EditorSettings["tones"]) => [
      t.shadows.range,
      t.midtones.range,
    ];
    expect(ranges(at(85, 170))).toEqual([85, 170]);
    expect(ranges(at(200, 150))).toEqual([149, 150]);
    expect(ranges(at(0, 0))).toEqual([0, 1]);
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

function colorGradient(width: number, height: number): Pixels {
  const pixels = createPixels(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      pixels.data.set(
        [u * 255, v * 255, (1 - u) * 200, 255],
        (y * width + x) * 4,
      );
    }
  }
  return pixels;
}

function usedColors({ data }: Pixels) {
  const set = new Set<string>();
  for (let i = 0; i < data.length; i += 4) {
    set.add(
      "#" +
        [data[i], data[i + 1], data[i + 2]]
          .map((v) => v.toString(16).padStart(2, "0"))
          .join(""),
    );
  }
  return set;
}

describe("palette dithering", () => {
  const methods = [
    "floyd-steinberg",
    "bayer-4-4",
    "random-dither",
    "none",
  ] as const;

  it.each(
    PALETTE_PRESETS.flatMap((p) => methods.map((m) => [p.id, m] as const)),
  )("%s with %s outputs only palette colors", (id, method) => {
    const preset = PALETTE_PRESETS.find((p) => p.id === id)!;
    const out = ditherToPalette(
      colorGradient(48, 32),
      method,
      preset.colors,
      preset.match,
    );
    for (const color of usedColors(out)) {
      expect(preset.colors).toContain(color);
    }
  });

  it.each(["brightness", "color"] as const)(
    "a one-color palette fills the image with it (%s)",
    (match) => {
      const out = ditherToPalette(
        gradient(8, 4),
        "floyd-steinberg",
        ["#336699"],
        match,
      );
      expect([...usedColors(out)]).toEqual(["#336699"]);
    },
  );

  it("error diffusion ignores what transparent pixels store", () => {
    // Left half transparent, right half a gray ramp. What the transparent
    // pixels hold must not change a single visible pixel.
    const cutout = (hidden: number[]) => {
      const px = createPixels(16, 16);
      for (let p = 0; p < 256; p++) {
        const v = (p % 16) * 16;
        px.data.set(p % 16 >= 8 ? [v, v, v, 255] : hidden, p * 4);
      }
      return px;
    };
    const visible = ({ data }: Pixels) =>
      [...data].filter((_, i) => (i >> 2) % 16 >= 8);
    const colors = ["#000000", "#555555", "#aaaaaa", "#ffffff"];
    for (const match of ["color", "brightness"] as const) {
      const [a, b] = [
        [0, 0, 0, 0],
        [200, 60, 90, 0],
      ].map((hidden) =>
        ditherToPalette(cutout(hidden), "floyd-steinberg", colors, match),
      );
      expect(visible(a)).toEqual(visible(b));
    }
    const [a, b] = [
      [0, 0, 0, 0],
      [200, 60, 90, 0],
    ].map(
      (hidden) =>
        renderPixels(
          cutout(hidden),
          { ...DEFAULT_SETTINGS, algorithm: "floyd-steinberg" },
          { dither: true },
        ).pixels,
    );
    expect(visible(a)).toEqual(visible(b));
  });

  it("brightness matching spans the whole ramp, even for one-hue palettes", () => {
    const gameboy = PALETTE_PRESETS.find((p) => p.id === "gameboy")!;
    const out = ditherToPalette(
      gradient(64, 8),
      "none",
      gameboy.colors,
      "brightness",
    );
    expect(usedColors(out).size).toBe(4);
  });

  it("color matching keeps saturated colors", () => {
    const red = createPixels(4, 4);
    for (let i = 0; i < red.data.length; i += 4)
      red.data.set([250, 10, 20, 255], i);
    const pico = PALETTE_PRESETS.find((p) => p.id === "pico8")!;
    const out = ditherToPalette(red, "none", pico.colors, "color");
    expect([...usedColors(out)]).toEqual(["#ff004d"]);
  });

  it("error diffusion reproduces the average color", () => {
    const gray = createPixels(64, 64);
    for (let i = 0; i < gray.data.length; i += 4)
      gray.data.set([128, 128, 128, 255], i);
    const out = ditherToPalette(
      gray,
      "floyd-steinberg",
      ["#000000", "#ffffff"],
      "color",
    );
    let sum = 0;
    for (let i = 0; i < out.data.length; i += 4) sum += out.data[i];
    expect(sum / (out.data.length / 4) / 255).toBeCloseTo(0.5, 1);
  });

  it("copies alpha from the source", () => {
    const src = colorGradient(8, 8);
    src.data[3] = 0;
    const out = ditherToPalette(
      src,
      "floyd-steinberg",
      ["#000000", "#ffffff"],
      "color",
    );
    expect(out.data[3]).toBe(0);
    expect(out.data[7]).toBe(255);
  });

  it("extracts the requested number of colors, dark to light", () => {
    const colors = extractPalette(colorGradient(64, 64), 8);
    expect(colors).toHaveLength(8);
    expect(new Set(colors).size).toBe(8);
    const luma = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    };
    for (let i = 1; i < colors.length; i++) {
      expect(luma(colors[i])).toBeGreaterThanOrEqual(luma(colors[i - 1]));
    }
  });

  it("stops early when the image has fewer colors than requested", () => {
    const flat = createPixels(8, 8);
    for (let i = 0; i < flat.data.length; i += 4)
      flat.data.set([10, 20, 30, 255], i);
    expect(extractPalette(flat, 8)).toEqual(["#0a141e"]);
  });

  it("renderPixels uses the extracted palette and reports it", () => {
    const { pixels, palette } = renderPixels(
      colorGradient(32, 32),
      {
        ...DEFAULT_SETTINGS,
        color: {
          ...DEFAULT_SETTINGS.color,
          mode: "palette",
          palette: "extracted",
          extractCount: 4,
        },
      },
      { dither: true },
    );
    expect(palette).toHaveLength(4);
    for (const color of usedColors(pixels)) expect(palette).toContain(color);
  });
});

describe("no dithering", () => {
  it("mono 'none' is a plain threshold at mid-gray", () => {
    const g = new Float32Array([0, 127, 128, 255]);
    expect([...dither(g, 4, 1, "none")]).toEqual([0, 0, 255, 255]);
  });
});
