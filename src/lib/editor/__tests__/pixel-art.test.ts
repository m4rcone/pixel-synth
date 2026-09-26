import { describe, expect, it } from "vitest";
import { PIXEL_ART_PRESET, pixelArtScale } from "../pixel-art";
import { MAX_IMAGE_SIZE } from "../load-image";
import { MIN_SCALE } from "../settings";

const output = (width: number, height: number) => {
  const scale = pixelArtScale(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

describe("pixel art preset size", () => {
  it.each([
    [1800, 1200], // landscape 3:2
    [1200, 1800], // portrait 2:3
    [2000, 2000], // square
    [1920, 1080], // 16:9
    [1080, 1920], // phone portrait
    [2000, 1000], // 2:1 panorama
  ])("keeps %i×%i near the target pixel count", (width, height) => {
    const out = output(width, height);
    const pixels = out.width * out.height;
    expect(pixels / PIXEL_ART_PRESET.targetPixels).toBeGreaterThan(0.95);
    expect(pixels / PIXEL_ART_PRESET.targetPixels).toBeLessThan(1.05);
  });

  it("matches the proposal's examples", () => {
    expect(output(1800, 1200)).toEqual({ width: 136, height: 91 });
    expect(output(1200, 1800)).toEqual({ width: 91, height: 136 });
    expect(output(2000, 2000)).toEqual({ width: 111, height: 111 });
  });

  it("keeps extreme panoramas at least 48 px on the short side", () => {
    expect(output(2000, 200).height).toBeGreaterThanOrEqual(
      PIXEL_ART_PRESET.minShortSide,
    );
    expect(output(200, 2000).width).toBeGreaterThanOrEqual(
      PIXEL_ART_PRESET.minShortSide,
    );
  });

  it("never enlarges small images", () => {
    expect(pixelArtScale(100, 80)).toBe(1);
    expect(output(100, 80)).toEqual({ width: 100, height: 80 });
  });

  it("stays within the editor's scale range for any upload", () => {
    const scale = pixelArtScale(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE);
    expect(scale).toBeGreaterThanOrEqual(MIN_SCALE);
    expect(scale).toBeLessThanOrEqual(1);
  });
});
