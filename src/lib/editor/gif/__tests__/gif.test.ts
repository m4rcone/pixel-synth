import { describe, expect, it } from "vitest";
import { createRandom } from "../../pixels";
import {
  decodeGif,
  GifFormatError,
  GifLimitError,
  readGifInfo,
} from "../decode";
import { encodeGif } from "../encode";
import {
  bitsFor,
  ByteWriter,
  LzwEncoder,
  lzwDecode,
  minCodeSizeFor,
} from "../lzw";

function randomPalette(colors: number, seed = 1) {
  const random = createRandom(seed);
  const palette = new Uint8Array(colors * 3);
  for (let i = 0; i < palette.length; i++) {
    palette[i] = Math.floor(random() * 256);
  }
  // Keep colors distinct so decoded pixels map back to one index.
  for (let c = 0; c < colors; c++) palette[c * 3] = c;
  return palette;
}

/** Noise mixed with flat runs, so LZW sees both short and long strings. */
function randomIndices(length: number, colors: number, seed: number) {
  const random = createRandom(seed);
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    out[i] =
      i % 97 < 40 ? Math.floor(i / 97) % colors : Math.floor(random() * colors);
  }
  return out;
}

function indicesOf(data: Uint8ClampedArray, palette: Uint8Array): number[] {
  const out: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const index = palette.findIndex(
      (_, c) =>
        c % 3 === 0 &&
        palette[c] === data[i] &&
        palette[c + 1] === data[i + 1] &&
        palette[c + 2] === data[i + 2],
    );
    out.push(data[i + 3] === 0 ? -1 : index / 3);
  }
  return out;
}

/** Image data for a hand-made GIF: min code size, LZW sub-blocks. */
function imageData(indices: number[], colors: number) {
  const out = new ByteWriter();
  const minCodeSize = minCodeSizeFor(colors);
  out.byte(minCodeSize);
  new LzwEncoder().encode(Uint8Array.from(indices), minCodeSize, out);
  return [...out.result()];
}

const RED = [255, 0, 0];
const GREEN = [0, 255, 0];
const BLUE = [0, 0, 255];
const WHITE = [255, 255, 255];

/** Builds a GIF from raw blocks: header, 4-color global table, blocks. */
function gif(width: number, height: number, blocks: number[][]) {
  return Uint8Array.from([
    ...[..."GIF89a"].map((c) => c.charCodeAt(0)),
    width & 255,
    width >> 8,
    height & 255,
    height >> 8,
    0x80 | 0x70 | 1, // global table of 4 colors
    0,
    0,
    ...RED,
    ...GREEN,
    ...BLUE,
    ...WHITE,
    ...blocks.flat(),
    0x3b,
  ]);
}

function control({
  disposal = 0,
  delay = 10,
  transparent,
}: {
  disposal?: number;
  delay?: number;
  transparent?: number;
}) {
  return [
    0x21,
    0xf9,
    4,
    (disposal << 2) | (transparent === undefined ? 0 : 1),
    delay & 255,
    delay >> 8,
    transparent ?? 0,
    0,
  ];
}

function descriptor(
  left: number,
  top: number,
  width: number,
  height: number,
  packed = 0,
) {
  return [0x2c, left, 0, top, 0, width, 0, height, 0, packed];
}

function pixel(data: Uint8ClampedArray, width: number, x: number, y: number) {
  return [...data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)];
}

describe("LZW", () => {
  it("round trips past the 4096-code table limit", () => {
    for (const colors of [2, 4, 16, 64, 256]) {
      const indices = randomIndices(60_000, colors, colors);
      const out = new ByteWriter();
      new LzwEncoder().encode(indices, minCodeSizeFor(colors), out);
      // Join the sub-blocks.
      const bytes = out.result();
      const data: number[] = [];
      for (let at = 0; bytes[at] > 0; at += bytes[at] + 1) {
        expect(bytes[at]).toBeLessThanOrEqual(255);
        data.push(...bytes.subarray(at + 1, at + 1 + bytes[at]));
      }
      const decoded = new Uint8Array(indices.length);
      expect(
        lzwDecode(Uint8Array.from(data), minCodeSizeFor(colors), decoded),
      ).toBe(indices.length);
      expect(decoded).toEqual(indices);
    }
  });

  it("stops at an invalid code instead of throwing", () => {
    // Min code size 2: clear = 4, end = 5. Clear, index 1, then code 7
    // (undefined: the next free code is 6).
    const bits = [4, 1, 7];
    let datum = 0;
    bits.forEach((code, i) => (datum |= code << (i * 3)));
    const out = new Uint8Array(10);
    expect(lzwDecode(Uint8Array.from([datum & 255, datum >> 8]), 2, out)).toBe(
      1,
    );
    expect(out[0]).toBe(1);
  });

  it("sizes codes from the palette", () => {
    expect([2, 3, 4, 5, 16, 17, 256].map(bitsFor)).toEqual([
      1, 2, 2, 3, 4, 5, 8,
    ]);
    expect(minCodeSizeFor(2)).toBe(2);
    expect(minCodeSizeFor(54)).toBe(6);
  });
});

describe("encodeGif → decodeGif", () => {
  it.each([2, 4, 16, 54, 64])(
    "reproduces pixels, delays and loop with %i colors",
    (colors) => {
      const width = 37;
      const height = 23;
      const palette = randomPalette(colors, colors);
      const frames = [0, 1, 2].map((f) => ({
        indices: randomIndices(width * height, colors, colors * 10 + f),
        delay: [100, 40, 1230][f],
      }));
      const bytes = encodeGif({ width, height, palette, frames, loop: 0 });
      const decoded = decodeGif(bytes);

      expect(decoded.width).toBe(width);
      expect(decoded.height).toBe(height);
      expect(decoded.loop).toBe(0);
      expect(decoded.frames.map((f) => f.delay)).toEqual([100, 40, 1230]);
      decoded.frames.forEach((frame, f) => {
        expect(indicesOf(frame.data, palette)).toEqual([...frames[f].indices]);
      });
    },
  );

  it.each([1, 3, 0])("keeps a loop count of %i", (loop) => {
    const bytes = encodeGif({
      width: 2,
      height: 2,
      palette: randomPalette(2),
      frames: [{ indices: new Uint8Array(4), delay: 100 }],
      loop,
    });
    expect(decodeGif(bytes).loop).toBe(loop);
  });

  it("writes a GIF89a with one image descriptor per frame", () => {
    const frames = Array.from({ length: 5 }, (_, f) => ({
      indices: randomIndices(64, 4, f),
      delay: 50,
    }));
    const bytes = encodeGif({
      width: 8,
      height: 8,
      palette: randomPalette(4),
      frames,
      loop: 0,
    });
    expect(String.fromCharCode(...bytes.subarray(0, 6))).toBe("GIF89a");
    expect(bytes[bytes.length - 1]).toBe(0x3b);
    expect(readGifInfo(bytes)).toEqual({ width: 8, height: 8, frames: 5 });
  });

  it("pads the color table to a power of two", () => {
    const bytes = encodeGif({
      width: 1,
      height: 1,
      palette: randomPalette(5),
      frames: [{ indices: Uint8Array.of(4), delay: 100 }],
      loop: 1,
    });
    expect(bytes[10] & 7).toBe(2); // 2^(2 + 1) = 8 entries
  });

  it("maps the transparent index to alpha 0", () => {
    const palette = randomPalette(4);
    const bytes = encodeGif({
      width: 2,
      height: 1,
      palette,
      frames: [{ indices: Uint8Array.of(3, 1), delay: 100 }],
      loop: 0,
      transparentIndex: 3,
    });
    const [frame] = decodeGif(bytes).frames;
    expect(indicesOf(frame.data, palette)).toEqual([-1, 1]);
  });

  it("refuses more than 256 colors", () => {
    expect(() =>
      encodeGif({
        width: 1,
        height: 1,
        palette: new Uint8Array(257 * 3),
        frames: [],
        loop: 0,
      }),
    ).toThrow(RangeError);
  });
});

describe("decodeGif", () => {
  it("reorders interlaced rows", () => {
    // 1 × 10 image; row y has index y % 4. Stored in interlaced order.
    const rows = [0, 8, 4, 2, 6, 1, 3, 5, 7, 9];
    const bytes = gif(1, 10, [
      descriptor(0, 0, 1, 10, 0x40),
      imageData(
        rows.map((y) => y % 4),
        4,
      ),
    ]);
    const [frame] = decodeGif(bytes).frames;
    const colors = [RED, GREEN, BLUE, WHITE];
    for (let y = 0; y < 10; y++) {
      expect(pixel(frame.data, 1, 0, y)).toEqual([...colors[y % 4], 255]);
    }
  });

  it("uses a local color table", () => {
    const local = [10, 20, 30, 40, 50, 60];
    const bytes = gif(2, 1, [
      descriptor(0, 0, 2, 1, 0x80), // local table of 2 colors
      local,
      imageData([1, 0], 2),
    ]);
    const [frame] = decodeGif(bytes).frames;
    expect(pixel(frame.data, 2, 0, 0)).toEqual([40, 50, 60, 255]);
    expect(pixel(frame.data, 2, 1, 0)).toEqual([10, 20, 30, 255]);
  });

  it("applies disposal 2 (clear) and 3 (restore previous)", () => {
    const bytes = gif(2, 2, [
      // Frame 1: background, all red, kept.
      control({ disposal: 1 }),
      descriptor(0, 0, 2, 2),
      imageData([0, 0, 0, 0], 4),
      // Frame 2: top-left green, then cleared.
      control({ disposal: 2 }),
      descriptor(0, 0, 1, 1),
      imageData([1], 4),
      // Frame 3: bottom-right blue, then restored to before it.
      control({ disposal: 3 }),
      descriptor(1, 1, 1, 1),
      imageData([2], 4),
      // Frame 4: top-right white.
      control({}),
      descriptor(1, 0, 1, 1),
      imageData([3], 4),
    ]);
    const { frames } = decodeGif(bytes);
    const at = (f: number, x: number, y: number) =>
      pixel(frames[f].data, 2, x, y);

    expect(at(1, 0, 0)).toEqual([...GREEN, 255]);
    expect(at(1, 1, 1)).toEqual([...RED, 255]);
    // Frame 2's rect was cleared to transparent.
    expect(at(2, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(at(2, 1, 1)).toEqual([...BLUE, 255]);
    // Frame 3 was undone: its pixel is back to red, the clear stays.
    expect(at(3, 1, 1)).toEqual([...RED, 255]);
    expect(at(3, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(at(3, 1, 0)).toEqual([...WHITE, 255]);
  });

  it("leaves transparent pixels showing the frame below", () => {
    const bytes = gif(2, 1, [
      control({ disposal: 1 }),
      descriptor(0, 0, 2, 1),
      imageData([0, 0], 4),
      control({ transparent: 3 }),
      descriptor(0, 0, 2, 1),
      imageData([3, 2], 4),
    ]);
    const { frames } = decodeGif(bytes);
    expect(pixel(frames[1].data, 2, 0, 0)).toEqual([...RED, 255]);
    expect(pixel(frames[1].data, 2, 1, 0)).toEqual([...BLUE, 255]);
  });

  it("shows delays of 0 and 1 as 100 ms, like browsers", () => {
    const bytes = gif(1, 1, [
      control({ delay: 0 }),
      descriptor(0, 0, 1, 1),
      imageData([0], 4),
      control({ delay: 1 }),
      descriptor(0, 0, 1, 1),
      imageData([0], 4),
      control({ delay: 7 }),
      descriptor(0, 0, 1, 1),
      imageData([0], 4),
    ]);
    expect(decodeGif(bytes).frames.map((f) => f.delay)).toEqual([100, 100, 70]);
  });

  it("plays once without a loop extension", () => {
    const bytes = gif(1, 1, [descriptor(0, 0, 1, 1), imageData([0], 4)]);
    expect(decodeGif(bytes).loop).toBe(1);
  });

  it("skips comments and unknown extensions", () => {
    const bytes = gif(1, 1, [
      [0x21, 0xfe, 3, 0x61, 0x62, 0x63, 0],
      [0x21, 0x01, 2, 1, 2, 1, 9, 0],
      descriptor(0, 0, 1, 1),
      imageData([2], 4),
    ]);
    expect(pixel(decodeGif(bytes).frames[0].data, 1, 0, 0)).toEqual([
      ...BLUE,
      255,
    ]);
  });

  it("returns the complete frames of a truncated file", () => {
    const frame = [
      control({}),
      descriptor(0, 0, 2, 2),
      imageData([1, 1, 1, 1], 4),
    ];
    const whole = gif(2, 2, [...frame, ...frame, ...frame]);
    // Cut inside the third frame's image data.
    const cut = whole.subarray(0, whole.length - 3);
    const { frames } = decodeGif(cut);
    expect(frames).toHaveLength(2);
    expect(readGifInfo(cut).frames).toBe(2);
  });

  it("throws a format error without one complete frame", () => {
    const whole = gif(2, 2, [
      descriptor(0, 0, 2, 2),
      imageData([1, 1, 1, 1], 4),
    ]);
    expect(() => decodeGif(whole.subarray(0, whole.length - 4))).toThrow(
      GifFormatError,
    );
    expect(() => decodeGif(Uint8Array.from([1, 2, 3, 4, 5, 6, 7]))).toThrow(
      GifFormatError,
    );
  });

  it("keeps a damaged frame's decoded pixels and ignores bad indices", () => {
    const bytes = gif(3, 1, [
      descriptor(0, 0, 3, 1),
      // Min code size 3 allows indices up to 7; the table has 4 colors.
      (() => {
        const out = new ByteWriter();
        out.byte(3);
        new LzwEncoder().encode(Uint8Array.of(1, 6, 2), 3, out);
        return [...out.result()];
      })(),
    ]);
    const [frame] = decodeGif(bytes).frames;
    expect(pixel(frame.data, 3, 0, 0)).toEqual([...GREEN, 255]);
    expect(pixel(frame.data, 3, 1, 0)).toEqual([0, 0, 0, 0]);
    expect(pixel(frame.data, 3, 2, 0)).toEqual([...BLUE, 255]);
  });

  it("stops with a typed error past the frame and pixel limits", () => {
    const frame = [descriptor(0, 0, 4, 4), imageData(Array(16).fill(0), 4)];
    const bytes = gif(4, 4, [...frame, ...frame, ...frame]);

    expect(() => decodeGif(bytes, { maxFrames: 2 })).toThrow(GifLimitError);
    try {
      decodeGif(bytes, { maxPixels: 40 });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GifLimitError);
      expect((error as GifLimitError).limit).toBe("pixels");
    }
    expect(
      decodeGif(bytes, { maxFrames: 3, maxPixels: 48 }).frames,
    ).toHaveLength(3);
  });

  it("scales every frame to the requested size", () => {
    const frame = [descriptor(0, 0, 4, 4), imageData(Array(16).fill(2), 4)];
    const decoded = decodeGif(gif(4, 4, [...frame, ...frame]), {
      size: { width: 2, height: 2 },
    });
    expect(decoded.width).toBe(2);
    expect(decoded.frames[1].data).toHaveLength(2 * 2 * 4);
    expect(pixel(decoded.frames[1].data, 2, 1, 1)).toEqual([...BLUE, 255]);
  });
});
