/**
 * LZW as GIF uses it: codes grow from `minCodeSize + 1` to 12 bits, packed
 * least significant bit first; a clear code resets the table and an end
 * code closes the stream.
 */

/** GIF's code table holds at most 4096 entries (12-bit codes). */
export const MAX_CODES = 4096;
const MAX_CODE_SIZE = 12;

/** Bits needed to index `colors` palette entries (at least 1). */
export function bitsFor(colors: number) {
  let bits = 1;
  while (1 << bits < colors) bits++;
  return bits;
}

/** GIF's minimum LZW code size for a palette of `colors` (at least 2). */
export function minCodeSizeFor(colors: number) {
  return Math.max(2, bitsFor(colors));
}

/** A growable byte buffer. */
export class ByteWriter {
  private buffer: Uint8Array<ArrayBuffer>;
  length = 0;

  constructor(capacity = 1 << 16) {
    this.buffer = new Uint8Array(capacity);
  }

  byte(value: number) {
    if (this.length === this.buffer.length) this.grow(1);
    this.buffer[this.length++] = value;
  }

  u16(value: number) {
    this.byte(value & 0xff);
    this.byte((value >> 8) & 0xff);
  }

  bytes(values: ArrayLike<number>) {
    if (this.length + values.length > this.buffer.length) {
      this.grow(values.length);
    }
    this.buffer.set(values, this.length);
    this.length += values.length;
  }

  ascii(text: string) {
    for (let i = 0; i < text.length; i++) this.byte(text.charCodeAt(i));
  }

  result(): Uint8Array<ArrayBuffer> {
    return this.buffer.slice(0, this.length);
  }

  private grow(extra: number) {
    let capacity = this.buffer.length * 2;
    while (capacity < this.length + extra) capacity *= 2;
    const next = new Uint8Array(capacity);
    next.set(this.buffer.subarray(0, this.length));
    this.buffer = next;
  }
}

/**
 * LZW compressor. Keeps its string table between calls (a trie indexed by
 * `prefix << 8 | index`, invalidated by bumping a generation stamp), so
 * encoding many frames allocates it once.
 */
export class LzwEncoder {
  private stamps = new Uint32Array(MAX_CODES << 8);
  private codes = new Uint16Array(MAX_CODES << 8);
  private generation = 0;

  /**
   * Writes `indices` as GIF image data: the LZW stream in sub-blocks of up
   * to 255 bytes, then the block terminator. The minimum code size byte
   * that precedes it is the caller's.
   */
  encode(indices: Uint8Array, minCodeSize: number, out: ByteWriter) {
    const clear = 1 << minCodeSize;
    const end = clear + 1;
    const block = new Uint8Array(255);
    let blockLength = 0;
    let datum = 0;
    let bits = 0;
    let codeSize = minCodeSize + 1;
    let next = end + 1;

    const flushBlock = () => {
      if (!blockLength) return;
      out.byte(blockLength);
      out.bytes(block.subarray(0, blockLength));
      blockLength = 0;
    };
    const emit = (code: number) => {
      datum |= code << bits;
      bits += codeSize;
      while (bits >= 8) {
        block[blockLength++] = datum & 0xff;
        if (blockLength === 255) flushBlock();
        datum >>>= 8;
        bits -= 8;
      }
    };
    const reset = () => {
      this.generation++;
      codeSize = minCodeSize + 1;
      next = end + 1;
    };

    reset();
    emit(clear);
    if (indices.length) {
      const { stamps, codes } = this;
      let prefix = indices[0];
      for (let i = 1; i < indices.length; i++) {
        const index = indices[i];
        const key = (prefix << 8) | index;
        if (stamps[key] === this.generation) {
          prefix = codes[key];
          continue;
        }
        emit(prefix);
        if (next < MAX_CODES) {
          stamps[key] = this.generation;
          codes[key] = next;
          // The decoder's table lags one entry behind: widen the code
          // once the entry just added no longer fits.
          if (next === 1 << codeSize && codeSize < MAX_CODE_SIZE) codeSize++;
          next++;
        } else {
          emit(clear);
          reset();
        }
        prefix = index;
      }
      emit(prefix);
    }
    emit(end);
    if (bits > 0) {
      block[blockLength++] = datum & 0xff;
      if (blockLength === 255) flushBlock();
    }
    flushBlock();
    out.byte(0);
  }
}

/**
 * Decompresses GIF image data (sub-blocks already joined) into `out`.
 * Returns how many indices were written: fewer than `out.length` when the
 * stream ends early or holds an invalid code, which stops decoding instead
 * of throwing so a damaged frame still shows what it has.
 */
export function lzwDecode(
  data: Uint8Array,
  minCodeSize: number,
  out: Uint8Array,
): number {
  if (minCodeSize < 1 || minCodeSize >= MAX_CODE_SIZE) return 0;
  const clear = 1 << minCodeSize;
  const end = clear + 1;
  const prefix = new Uint16Array(MAX_CODES);
  const suffix = new Uint8Array(MAX_CODES);
  const stack = new Uint8Array(MAX_CODES + 1);
  let codeSize = minCodeSize + 1;
  let mask = (1 << codeSize) - 1;
  let next = end + 1;
  let previous = -1;
  let first = 0;
  let datum = 0;
  let bits = 0;
  let position = 0;
  let written = 0;

  while (written < out.length) {
    while (bits < codeSize) {
      if (position >= data.length) return written;
      datum |= data[position++] << bits;
      bits += 8;
    }
    const code = datum & mask;
    datum >>>= codeSize;
    bits -= codeSize;

    if (code === clear) {
      codeSize = minCodeSize + 1;
      mask = (1 << codeSize) - 1;
      next = end + 1;
      previous = -1;
      continue;
    }
    if (code === end) return written;
    if (previous === -1) {
      if (code > clear) return written;
      out[written++] = code;
      previous = first = code;
      continue;
    }
    if (code > next) return written;

    let sp = 0;
    let c = code;
    if (code === next) {
      // The code being defined right now: previous string + its first index.
      stack[sp++] = first;
      c = previous;
    }
    while (c > end) {
      stack[sp++] = suffix[c];
      c = prefix[c];
    }
    first = c;
    stack[sp++] = c;

    if (next < MAX_CODES) {
      prefix[next] = previous;
      suffix[next] = first;
      next++;
      if (next === 1 << codeSize && codeSize < MAX_CODE_SIZE) {
        codeSize++;
        mask = (1 << codeSize) - 1;
      }
    }
    previous = code;
    while (sp > 0 && written < out.length) out[written++] = stack[--sp];
  }
  return written;
}
