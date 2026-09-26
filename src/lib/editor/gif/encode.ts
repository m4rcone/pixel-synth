import { bitsFor, ByteWriter, LzwEncoder, minCodeSizeFor } from "./lzw";

/**
 * Animated GIF encoder for already indexed frames: one global color table,
 * full-size frames, no quantization (dithered output has few colors).
 */

export type GifEncodeFrame = {
  /** One palette index per pixel, row by row. */
  indices: Uint8Array;
  /** Display time in milliseconds (rounded to 1/100 s, at least 20 ms). */
  delay: number;
};

export type GifEncodeInput = {
  width: number;
  height: number;
  /** RGB triplets, at most 256 colors. */
  palette: Uint8Array;
  /** Any iterable, so large frames can be produced one at a time. */
  frames: Iterable<GifEncodeFrame>;
  /** How many times the animation plays; 0 = forever. */
  loop: number;
  /** Palette index shown as transparent, if any. */
  transparentIndex?: number;
};

/** Browsers show shorter delays (0 or 1 × 1/100 s) as 100 ms. */
const MIN_DELAY = 2;

export function encodeGif({
  width,
  height,
  palette,
  frames,
  loop,
  transparentIndex,
}: GifEncodeInput): Uint8Array<ArrayBuffer> {
  const colors = palette.length / 3;
  if (!Number.isInteger(colors) || colors < 1 || colors > 256) {
    throw new RangeError(`A GIF palette holds 1 to 256 colors, not ${colors}`);
  }
  const tableBits = bitsFor(colors);
  const minCodeSize = minCodeSizeFor(colors);
  const transparent = transparentIndex !== undefined;
  const out = new ByteWriter(
    Math.min(1 << 24, Math.max(1 << 16, width * height)),
  );

  out.ascii("GIF89a");
  out.u16(width);
  out.u16(height);
  // Global color table, 8-bit color resolution, table size 2^(n + 1).
  out.byte(0x80 | 0x70 | (tableBits - 1));
  out.byte(0); // background color index
  out.byte(0); // pixel aspect ratio
  out.bytes(palette);
  for (let c = colors; c < 1 << tableBits; c++) out.bytes([0, 0, 0]);

  if (loop !== 1) {
    out.bytes([0x21, 0xff, 11]);
    out.ascii("NETSCAPE2.0");
    out.bytes([3, 1]);
    // Extra plays after the first; 0 loops forever.
    out.u16(loop === 0 ? 0 : Math.min(0xffff, loop - 1));
    out.byte(0);
  }

  const lzw = new LzwEncoder();
  for (const frame of frames) {
    // Graphic control: disposal 1 (keep) or 2 (clear, so transparent
    // pixels show what's behind the image rather than the last frame).
    out.bytes([0x21, 0xf9, 4]);
    out.byte(((transparent ? 2 : 1) << 2) | (transparent ? 1 : 0));
    out.u16(
      Math.min(0xffff, Math.max(MIN_DELAY, Math.round(frame.delay / 10))),
    );
    out.byte(transparent ? transparentIndex : 0);
    out.byte(0);

    out.byte(0x2c);
    out.u16(0);
    out.u16(0);
    out.u16(width);
    out.u16(height);
    out.byte(0); // no local color table, not interlaced
    out.byte(minCodeSize);
    lzw.encode(frame.indices, minCodeSize, out);
  }

  out.byte(0x3b);
  return out.result();
}
