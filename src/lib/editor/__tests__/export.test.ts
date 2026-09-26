import { describe, expect, it } from "vitest";
import { MAX_IMAGE_SIZE } from "../load-image";
import {
  defaultExportFactor,
  exportFits,
  MAX_EXPORT_AREA,
  MAX_EXPORT_SIDE,
} from "../export";

describe("export sizes", () => {
  it("rejects sizes past the smallest desktop canvas limits", () => {
    // The sample at ×8 (14400 × 9600) is past Firefox's area limit.
    expect(exportFits(1800, 1200, 4)).toBe(true);
    expect(exportFits(1800, 1200, 8)).toBe(false);
    expect(exportFits(MAX_EXPORT_SIDE + 1, 1, 1)).toBe(false);
    expect(exportFits(10_000, Math.floor(MAX_EXPORT_AREA / 10_000), 1)).toBe(
      true,
    );
  });

  it("always offers ×1 for any image the editor accepts", () => {
    expect(exportFits(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, 1)).toBe(true);
  });

  it("suggests the largest factor up to ~1000 px", () => {
    expect(defaultExportFactor(4, 4)).toBe(8);
    expect(defaultExportFactor(136, 91)).toBe(4);
    expect(defaultExportFactor(1800, 1200)).toBe(1);
  });
});
