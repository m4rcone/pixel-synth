import { describe, expect, it } from "vitest";
import {
  animationSize,
  decodeAnimation,
  encodeAnimation,
  MAX_ANIMATION_FRAMES,
  MAX_ANIMATION_PIXELS,
  MIN_ANIMATION_SIDE,
} from "../animation";
import {
  defaultGifFactor,
  gifExportFits,
  MAX_GIF_EXPORT_PIXELS,
} from "../export";
import { decodeGif } from "../gif/decode";
import { GifLimitError, TooManyColorsError } from "../gif/errors";
import { renderAnimation, renderPixels } from "../pipeline";
import { createPixels, hexToRgb, type Pixels } from "../pixels";
import { MAX_IMAGE_SIZE } from "../resize";
import { DEFAULT_SETTINGS, type EditorSettings } from "../settings";

/** A hue sweep that shifts over time, so each frame has other colors. */
function frames(count: number, width = 48, height = 32): Pixels[] {
  return Array.from({ length: count }, (_, f) => {
    const pixels = createPixels(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = (x + f * 7) / width;
        pixels.data.set(
          [
            128 + 127 * Math.sin(t * 6),
            128 + 127 * Math.sin(t * 6 + 2),
            (y / height) * 255,
            255,
          ],
          (y * width + x) * 4,
        );
      }
    }
    return pixels;
  });
}

const paletteSettings = (
  color: Partial<EditorSettings["color"]>,
): EditorSettings => ({
  ...DEFAULT_SETTINGS,
  algorithm: "floyd-steinberg",
  color: { ...DEFAULT_SETTINGS.color, mode: "palette", ...color },
});

function colorsOf({ data }: Pixels) {
  const colors = new Set<string>();
  for (let i = 0; i < data.length; i += 4) {
    colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
  }
  return colors;
}

describe("renderAnimation", () => {
  it.each([
    ["From image", { palette: "extracted", extractCount: 6 }],
    ["a preset", { palette: "pico8" }],
  ] as const)("dithers every frame to one palette (%s)", (_, color) => {
    const settings = paletteSettings(color);
    const { frames: out, palette } = renderAnimation(frames(20), settings, {
      dither: true,
    });
    expect(palette).not.toBeNull();
    const allowed = new Set(palette!.map((hex) => hexToRgb(hex).join(",")));
    for (const frame of out) {
      for (const color of colorsOf(frame)) expect(allowed).toContain(color);
    }
  });

  it("renders a single frame exactly like renderPixels", () => {
    const [still] = frames(1);
    for (const settings of [
      paletteSettings({ palette: "extracted", extractCount: 8 }),
      paletteSettings({ palette: "gameboy", match: "brightness" }),
      { ...DEFAULT_SETTINGS, scale: 0.5 },
    ]) {
      const expected = renderPixels(still, settings, { dither: true });
      const actual = renderAnimation([still], settings, { dither: true });
      expect(actual.frames[0].data).toEqual(expected.pixels.data);
      expect(actual.palette).toEqual(expected.palette);
    }
  });

  it("reports each frame as it is rendered", () => {
    const seen: number[] = [];
    renderAnimation(frames(3), DEFAULT_SETTINGS, { dither: true }, (index) =>
      seen.push(index),
    );
    expect(seen).toEqual([0, 1, 2]);
  });
});

describe("animationSize", () => {
  it("keeps small animations at their size", () => {
    expect(animationSize(400, 300, 80)).toEqual({ width: 400, height: 300 });
  });

  it("scales to the longest-edge limit first", () => {
    expect(animationSize(MAX_IMAGE_SIZE * 2, MAX_IMAGE_SIZE, 2)).toEqual({
      width: MAX_IMAGE_SIZE,
      height: MAX_IMAGE_SIZE / 2,
    });
  });

  it("scales every frame down uniformly to the pixel budget", () => {
    const { width, height } = animationSize(1600, 1200, 100);
    expect(100 * width * height).toBeLessThanOrEqual(MAX_ANIMATION_PIXELS);
    expect(100 * width * height).toBeGreaterThan(MAX_ANIMATION_PIXELS * 0.98);
    expect(width / height).toBeCloseTo(4 / 3, 2);
  });

  it("refuses too many frames, or a budget below the minimum side", () => {
    expect(() => animationSize(100, 100, MAX_ANIMATION_FRAMES + 1)).toThrow(
      GifLimitError,
    );
    // A long banner: fitting 300 frames in the budget would take its
    // 80 px side below the minimum.
    expect(
      80 * Math.sqrt(MAX_ANIMATION_PIXELS / (300 * 2000 * 80)),
    ).toBeLessThan(MIN_ANIMATION_SIDE);
    expect(() => animationSize(2000, 80, 300)).toThrow(GifLimitError);
    expect(animationSize(2000, 100, 300).height).toBeGreaterThanOrEqual(
      MIN_ANIMATION_SIDE,
    );
  });
});

describe("encodeAnimation", () => {
  it("round trips rendered frames, enlarged, with timing and loop", () => {
    const settings = paletteSettings({ palette: "pico8" });
    const rendered = renderAnimation(frames(4, 20, 10), settings, {
      dither: true,
    }).frames;
    const delays = [100, 200, 50, 70];
    const gif = decodeGif(encodeAnimation(rendered, delays, 3, 2));

    expect(gif.width).toBe(40);
    expect(gif.height).toBe(20);
    expect(gif.loop).toBe(3);
    expect(gif.frames.map((f) => f.delay)).toEqual(delays);
    gif.frames.forEach(({ data }, f) => {
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 40; x++) {
          const src = ((y >> 1) * 20 + (x >> 1)) * 4;
          const out = (y * 40 + x) * 4;
          expect([...data.subarray(out, out + 4)]).toEqual([
            ...rendered[f].data.subarray(src, src + 4),
          ]);
        }
      }
    });
  });

  it("maps pixels below half alpha to transparency", () => {
    const frame = createPixels(2, 1);
    frame.data.set([10, 20, 30, 255, 99, 99, 99, 40]);
    const [decoded] = decodeGif(encodeAnimation([frame], [100], 0)).frames;
    expect([...decoded.data]).toEqual([10, 20, 30, 255, 0, 0, 0, 0]);
  });

  it("refuses more than 256 colors", () => {
    const frame = createPixels(257, 1);
    for (let x = 0; x < 257; x++)
      frame.data.set([x & 255, x >> 8, 0, 255], x * 4);
    expect(() => encodeAnimation([frame], [100], 0)).toThrow(
      TooManyColorsError,
    );
  });

  it("decodes back as an animation, and a single frame as none", () => {
    const rendered = frames(3, 8, 8).map(
      (f) => renderPixels(f, DEFAULT_SETTINGS, { dither: true }).pixels,
    );
    const animation = decodeAnimation(
      encodeAnimation(rendered, [100, 100, 100], 0),
    );
    expect(animation?.frames).toHaveLength(3);
    expect(animation?.frames[2].data).toEqual(rendered[2].data);
    expect(
      decodeAnimation(encodeAnimation([rendered[0]], [100], 0)),
    ).toBeNull();
  });
});

describe("GIF export size", () => {
  it("aims at about 800 px within the export budget", () => {
    expect(defaultGifFactor(200, 150, 24)).toBe(4);
    expect(defaultGifFactor(400, 300, 24)).toBe(2);
    expect(defaultGifFactor(1000, 800, 10)).toBe(1);
    // 300 frames of 400 × 300 at ×2 is past the budget.
    expect(gifExportFits(400, 300, 300, 2)).toBe(false);
    expect(defaultGifFactor(400, 300, 300)).toBe(1);
    expect(gifExportFits(100, 100, 1, 8)).toBe(
      100 * 100 * 64 <= MAX_GIF_EXPORT_PIXELS,
    );
  });
});
