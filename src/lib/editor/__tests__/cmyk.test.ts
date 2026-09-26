import { describe, expect, it } from "vitest";
import {
  ditherCmyk,
  inkAngle,
  inkMasks,
  INKS,
  OVERPRINTS,
  separate,
} from "../cmyk";
import { dither } from "../dither";
import { renderPixels } from "../pipeline";
import { createPixels, type Pixels } from "../pixels";
import {
  DEFAULT_SETTINGS,
  type DitherChoice,
  type EditorSettings,
} from "../settings";

function solid(rgb: [number, number, number], size = 64, alpha = 255): Pixels {
  const pixels = createPixels(size, size);
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data.set([...rgb, alpha], i);
  }
  return pixels;
}

function cmyk(patch: Partial<EditorSettings> = {}, black = 0.5) {
  return {
    ...DEFAULT_SETTINGS,
    ...patch,
    color: { ...DEFAULT_SETTINGS.color, mode: "cmyk" as const, black },
  };
}

/** Share of pixels carrying each ink. */
function coverage(src: Pixels, settings: EditorSettings) {
  const masks = inkMasks(src, settings);
  return INKS.map(
    (_, n) => masks.filter((mask) => mask & (1 << n)).length / masks.length,
  );
}

describe("CMYK separation", () => {
  it("prints nothing on white", () => {
    for (const plane of separate(solid([255, 255, 255], 2), 0.5)) {
      expect([...plane]).toEqual([255, 255, 255, 255]);
    }
  });

  it("moves shared gray to black as the black amount grows", () => {
    const at = (black: number) =>
      separate(solid([0, 0, 0], 1), black).map((plane) => plane[0]);
    expect(at(0)).toEqual([0, 0, 0, 255]);
    expect(at(1)).toEqual([255, 255, 255, 0]);
    const [c, , , k] = at(0.5);
    expect(k).toBeCloseTo(127.5);
    expect(c).toBeCloseTo(0);
  });

  it("keeps the overprinted color whatever the black amount", () => {
    const colors: [number, number, number][] = [
      [200, 120, 60],
      [30, 90, 160],
      [128, 128, 128],
      [10, 250, 90],
    ];
    for (const rgb of colors) {
      for (const black of [0, 0.3, 0.5, 1]) {
        const [c, m, y, k] = separate(solid(rgb, 1), black).map(
          (plane) => plane[0] / 255,
        );
        // Ideal inks multiply: paper left by each ink, times what black leaves.
        expect(c * k * 255).toBeCloseTo(rgb[0], 3);
        expect(m * k * 255).toBeCloseTo(rgb[1], 3);
        expect(y * k * 255).toBeCloseTo(rgb[2], 3);
      }
    }
  });
});

describe("CMYK dithering", () => {
  it("turns the screens to the classic angles", () => {
    expect(INKS.map(({ offset }) => inkAngle(45, offset))).toEqual([
      15, 75, 0, 45,
    ]);
    // Rotating the black screen keeps the offsets, within 0–180°.
    expect(INKS.map(({ offset }) => inkAngle(0, offset))).toEqual([
      150, 30, 135, 0,
    ]);
  });

  it("gives every ink its coverage, with every kind of algorithm", () => {
    const rgb: [number, number, number] = [200, 120, 60];
    const expected = separate(solid(rgb, 1), 0.5).map(
      (plane) => 1 - plane[0] / 255,
    );
    const algorithms: DitherChoice[] = [
      "floyd-steinberg",
      "bayer-8-8",
      "blue-noise",
      "random-dither",
      "halftone",
      "line-screen",
    ];
    for (const algorithm of algorithms) {
      coverage(solid(rgb, 128), cmyk({ algorithm })).forEach((share, n) =>
        expect(share, `${algorithm} ${INKS[n].name}`).toBeCloseTo(
          expected[n],
          1,
        ),
      );
    }
  });

  it("prints no black at 0%, and grays in black alone at 100%", () => {
    const [, , , noBlack] = coverage(solid([90, 90, 90]), cmyk({}, 0));
    expect(noBlack).toBe(0);
    const [c, m, y, k] = coverage(solid([90, 90, 90]), cmyk({}, 1));
    expect([c, m, y]).toEqual([0, 0, 0]);
    expect(k).toBeCloseTo(1 - 90 / 255, 1);
  });

  it("keeps the inks' ordered patterns apart", () => {
    // Same mask for every ink would stack their dots on the same pixels.
    const gray = new Float32Array(64 * 64).fill(128);
    const first = dither(gray, 64, 64, "blue-noise", 1, undefined, 0);
    const second = dither(gray, 64, 64, "blue-noise", 1, undefined, 1);
    expect(first).not.toEqual(second);
    const inked = (bits: Uint8Array) => bits.filter((v) => v === 0).length;
    expect(inked(second)).toBe(inked(first));
  });

  it("copies alpha and is what the pipeline renders", () => {
    const src = solid([40, 160, 220], 16, 90);
    const settings = cmyk({ algorithm: "halftone" });
    const out = ditherCmyk(src, settings);
    expect(out.data.filter((_, i) => i % 4 === 3).every((a) => a === 90)).toBe(
      true,
    );
    const rendered = renderPixels(src, settings, { dither: true });
    expect(rendered.palette).toBeNull();
    expect(rendered.pixels.data).toEqual(out.data);
  });

  it("overprints the inks by multiplying them on white paper", () => {
    expect(OVERPRINTS[0]).toEqual([255, 255, 255]);
    // Cyan (#00aeef) over yellow (#fff200): a green.
    expect(OVERPRINTS[0b0101]).toEqual([0, 165, 0]);
    const out = ditherCmyk(solid([200, 120, 60], 32), cmyk());
    const masks = inkMasks(solid([200, 120, 60], 32), cmyk());
    masks.forEach((mask, p) =>
      expect([...out.data.subarray(p * 4, p * 4 + 3)]).toEqual(
        OVERPRINTS[mask],
      ),
    );
  });
});
