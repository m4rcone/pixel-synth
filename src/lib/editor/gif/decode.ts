import type { Pixels } from "../pixels";
import { resizeArea } from "../resize";
import { GifFormatError, GifLimitError } from "./errors";
import { lzwDecode } from "./lzw";

export { GifFormatError, GifLimitError };

/**
 * GIF decoder (GIF87a and GIF89a). Frames come out coalesced: every frame is
 * a full RGBA image the size of the logical screen, with the previous
 * frames' disposal already applied, the way browsers show them.
 */

export type GifFrame = {
  data: Uint8ClampedArray<ArrayBuffer>;
  /** Display time in milliseconds. */
  delay: number;
};

export type DecodedGif = {
  width: number;
  height: number;
  frames: GifFrame[];
  /** How many times the animation plays; 0 = forever. */
  loop: number;
};

export type GifInfo = { width: number; height: number; frames: number };

export type GifDecodeOptions = {
  /** More frames than this throws a {@link GifLimitError}. */
  maxFrames?: number;
  /** More decoded pixels (frames × width × height) throws a {@link GifLimitError}. */
  maxPixels?: number;
  /** Scale every frame to this size (area averaging) as it is decoded. */
  size?: { width: number; height: number };
};

/** Browsers show delays of 0 and 1 (1/100 s) as 100 ms. */
const DEFAULT_DELAY = 100;

class Truncated {}

class Reader {
  position = 0;
  constructor(readonly bytes: Uint8Array) {}

  u8() {
    if (this.position >= this.bytes.length) throw new Truncated();
    return this.bytes[this.position++];
  }

  u16() {
    return this.u8() | (this.u8() << 8);
  }

  take(length: number) {
    if (this.position + length > this.bytes.length) throw new Truncated();
    const out = this.bytes.subarray(this.position, this.position + length);
    this.position += length;
    return out;
  }

  /** Each data sub-block up to the terminator. */
  subBlocks(): Uint8Array[] {
    const blocks: Uint8Array[] = [];
    for (let size = this.u8(); size > 0; size = this.u8()) {
      blocks.push(this.take(size));
    }
    return blocks;
  }

  skipSubBlocks() {
    for (let size = this.u8(); size > 0; size = this.u8()) this.take(size);
  }

  /** The sub-blocks' data joined into one buffer. */
  joinedSubBlocks() {
    const blocks = this.subBlocks();
    const out = new Uint8Array(blocks.reduce((n, b) => n + b.length, 0));
    let offset = 0;
    for (const block of blocks) {
      out.set(block, offset);
      offset += block.length;
    }
    return out;
  }
}

type ColorTable = { rgb: Uint8Array; count: number };

type Screen = { width: number; height: number; global: ColorTable | null };

export function isGif(bytes: Uint8Array) {
  return (
    bytes.length >= 6 &&
    bytes[0] === 0x47 && // G
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x38 // 8
  );
}

function readScreen(reader: Reader): Screen {
  if (!isGif(reader.bytes)) throw new GifFormatError("Not a GIF file");
  try {
    reader.take(6);
    const width = reader.u16();
    const height = reader.u16();
    const packed = reader.u8();
    reader.take(2); // background color index, pixel aspect ratio
    const global = packed & 0x80 ? readColorTable(reader, packed) : null;
    if (!width || !height) throw new GifFormatError("Empty GIF");
    return { width, height, global };
  } catch (error) {
    if (error instanceof Truncated) throw new GifFormatError("Truncated GIF");
    throw error;
  }
}

function readColorTable(reader: Reader, packed: number): ColorTable {
  const count = 2 << (packed & 7);
  return { rgb: reader.take(count * 3), count };
}

/**
 * Size and frame count, without decoding any pixels (to pick limits and a
 * scale before the real decode). Counts the frames present in a truncated
 * file.
 */
export function readGifInfo(bytes: Uint8Array): GifInfo {
  const reader = new Reader(bytes);
  const { width, height } = readScreen(reader);
  let frames = 0;
  try {
    for (;;) {
      const block = reader.u8();
      if (block === 0x21) {
        reader.u8();
        reader.skipSubBlocks();
      } else if (block === 0x2c) {
        reader.take(8);
        const packed = reader.u8();
        if (packed & 0x80) readColorTable(reader, packed);
        reader.u8();
        reader.skipSubBlocks();
        frames++;
      } else break;
    }
  } catch (error) {
    if (!(error instanceof Truncated)) throw error;
  }
  return { width, height, frames };
}

type Control = { disposal: number; delay: number; transparent: number };

const NO_CONTROL: Control = { disposal: 0, delay: 0, transparent: -1 };

/** Rows of an interlaced image in the order they are stored. */
function interlacedRows(height: number): Uint32Array {
  const rows = new Uint32Array(height);
  let i = 0;
  for (const [start, step] of [
    [0, 8],
    [4, 8],
    [2, 4],
    [1, 2],
  ]) {
    for (let y = start; y < height; y += step) rows[i++] = y;
  }
  return rows;
}

/**
 * Decodes every frame. Damaged data never throws past its frame: invalid
 * LZW codes end that frame's pixels and out-of-range color indices are left
 * transparent. A truncated file returns the frames completed before the
 * cut; with none complete it throws a {@link GifFormatError}.
 */
export function decodeGif(
  bytes: Uint8Array,
  { maxFrames = Infinity, maxPixels = Infinity, size }: GifDecodeOptions = {},
): DecodedGif {
  const reader = new Reader(bytes);
  const screen = readScreen(reader);
  const { width, height } = screen;
  const outWidth = size?.width ?? width;
  const outHeight = size?.height ?? height;
  const resize = outWidth !== width || outHeight !== height;
  if (width * height > maxPixels || outWidth * outHeight > maxPixels) {
    throw new GifLimitError("pixels", maxPixels);
  }

  const canvas = new Uint8ClampedArray(width * height * 4);
  const frames: GifFrame[] = [];
  let loop = 1;
  let control = NO_CONTROL;
  // What the previous frame asks to do before the next one is drawn.
  let dispose: (() => void) | null = null;

  try {
    for (;;) {
      const block = reader.u8();
      if (block === 0x3b) break;

      if (block === 0x21) {
        const label = reader.u8();
        const blocks = reader.subBlocks();
        if (label === 0xf9 && blocks[0]?.length >= 4) {
          const [packed, lo, hi, transparent] = blocks[0];
          control = {
            disposal: (packed >> 2) & 7,
            delay: lo | (hi << 8),
            transparent: packed & 1 ? transparent : -1,
          };
        } else if (label === 0xff && blocks.length >= 2) {
          const id = String.fromCharCode(...blocks[0]);
          const data = blocks[1];
          if (
            (id === "NETSCAPE2.0" || id === "ANIMEXTS1.0") &&
            data.length >= 3 &&
            data[0] === 1
          ) {
            const repeat = data[1] | (data[2] << 8);
            // The count is extra plays after the first; 0 loops forever.
            loop = repeat === 0 ? 0 : repeat + 1;
          }
        }
        continue;
      }

      if (block !== 0x2c) break; // not a GIF block: treat as the end

      const left = reader.u16();
      const top = reader.u16();
      const w = reader.u16();
      const h = reader.u16();
      const packed = reader.u8();
      const table =
        packed & 0x80 ? readColorTable(reader, packed) : screen.global;
      const minCodeSize = reader.u8();
      const data = reader.joinedSubBlocks();

      if (frames.length === maxFrames) {
        throw new GifLimitError("frames", maxFrames);
      }
      if ((frames.length + 1) * outWidth * outHeight > maxPixels) {
        throw new GifLimitError("pixels", maxPixels);
      }

      dispose?.();
      dispose = null;
      const { disposal, transparent } = control;
      if (disposal === 2) {
        dispose = () => clearRect(canvas, width, height, left, top, w, h);
      } else if (disposal === 3) {
        const saved = canvas.slice();
        dispose = () => canvas.set(saved);
      }

      const indices = new Uint8Array(w * h);
      const count = lzwDecode(data, minCodeSize, indices);
      const rows = packed & 0x40 ? interlacedRows(h) : null;
      const colors = table?.count ?? 0;
      const rgb = table?.rgb;
      for (let p = 0; p < count; p++) {
        const row = (p / w) | 0;
        const y = top + (rows ? rows[row] : row);
        const x = left + (p - row * w);
        if (x >= width || y >= height) continue;
        const index = indices[p];
        if (index === transparent || index >= colors || !rgb) continue;
        const o = (y * width + x) * 4;
        canvas[o] = rgb[index * 3];
        canvas[o + 1] = rgb[index * 3 + 1];
        canvas[o + 2] = rgb[index * 3 + 2];
        canvas[o + 3] = 255;
      }

      const snapshot: Pixels = { data: canvas.slice(), width, height };
      frames.push({
        data: resize
          ? resizeArea(snapshot, outWidth, outHeight).data
          : snapshot.data,
        delay: control.delay <= 1 ? DEFAULT_DELAY : control.delay * 10,
      });
      control = NO_CONTROL;
    }
  } catch (error) {
    if (!(error instanceof Truncated)) throw error;
    if (!frames.length) throw new GifFormatError("Truncated GIF");
  }

  if (!frames.length) throw new GifFormatError("GIF without images");
  return { width: outWidth, height: outHeight, frames, loop };
}

function clearRect(
  canvas: Uint8ClampedArray,
  width: number,
  height: number,
  left: number,
  top: number,
  w: number,
  h: number,
) {
  const right = Math.min(width, left + w);
  const bottom = Math.min(height, top + h);
  for (let y = top; y < bottom; y++) {
    if (left < right)
      canvas.fill(0, (y * width + left) * 4, (y * width + right) * 4);
  }
}
