import { describe, expect, it } from "vitest";
import {
  SUPPORTED_FORMAT_NAMES,
  SUPPORTED_FORMATS_SHORT,
  SUPPORTED_IMAGE_TYPES,
} from "../load-image";

describe("supported formats", () => {
  it("names every accepted image type, in order", () => {
    expect(
      SUPPORTED_FORMAT_NAMES.map((name) => `image/${name.toLowerCase()}`),
    ).toEqual([...SUPPORTED_IMAGE_TYPES]);
  });

  it("reads as a compact readout", () => {
    expect(SUPPORTED_FORMATS_SHORT).toBe(
      "PNG · JPEG · WebP · GIF · AVIF · BMP",
    );
  });
});
